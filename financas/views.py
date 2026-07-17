# financas/views.py
from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db import transaction
from decimal import Decimal
from .models import Despesa, ReceitaSemanal, StatusDespesa
from .serializers import DespesaSerializer, ReceitaSemanalSerializer

class DespesaViewSet(viewsets.ModelViewSet):
    serializer_class = DespesaSerializer
    permission_classes = [IsAuthenticated] # Exige login real com Token JWT

    def get_queryset(self):
        """Filtra as despesas pelo mês e semana passados via query params no frontend."""
        queryset = Despesa.objects.all()
        mes_ano = self.request.query_params.get('mes_ano', '2026-07')
        semana = self.request.query_params.get('semana', None)
        
        queryset = queryset.filter(mes_ano=mes_ano)
        if semana is not None:
            queryset = queryset.filter(semana=semana)
        return queryset

    @action(detail=False, methods=['post'], url_path='distribuir-caixa')
    def distribuir_caixa(self, request):
        """
        Executa o algoritmo de distribuição em cascata com transação segura no Postgres.
        Payload esperado: {"mes_ano": "2026-07", "semana": 1, "valor_entrada": 5800.00}
        """
        mes_ano = request.data.get('mes_ano', '2026-07')
        semana = request.data.get('semana')
        valor_entrada = Decimal(str(request.data.get('valor_entrada', '0.00')))

        if not semana or valor_entrada <= 0:
            return Response(
                {"erro": "Semana e valor de entrada positivo são obrigatórios."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mapeamento de prioridade de pagamento
        prioridade_map = {
            'Consumo': 1, 'Impostos': 1,
            'Operacional': 2,
            'Empréstimos': 3,
            'Cartões': 4,
            'Pessoal': 5
        }

        with transaction.atomic():
            # 1. Atualiza ou cria a receita da semana no banco
            ReceitaSemanal.objects.update_or_create(
                mes_ano=mes_ano, semana=semana,
                defaults={'valor': valor_entrada}
            )

            # 2. Busca todas as contas da semana e reseta os pagamentos daquela rodada
            despesas = list(Despesa.objects.select_for_update().filter(mes_ano=mes_ano, semana=semana))
            
            # 3. Ordenação por prioridade e dia de vencimento
            despesas.sort(key=lambda x: (prioridade_map.get(x.categoria, 99), x.dia_vencimento))

            caixa_disponivel = valor_entrada

            for desp in despesas:
                if caixa_disponivel >= desp.valor_original:
                    desp.valor_pago = desp.valor_original
                    desp.status = StatusDespesa.PAGO
                    caixa_disponivel -= desp.valor_original
                elif caixa_disponivel > Decimal('0.00'):
                    desp.valor_pago = caixa_disponivel
                    desp.status = StatusDespesa.PARCIAL
                    caixa_disponivel = Decimal('0.00')
                else:
                    desp.valor_pago = Decimal('0.00')
                    desp.status = StatusDespesa.PENDENTE
                desp.save()

        # Retorna a lista atualizada
        despesas_atualizadas = Despesa.objects.filter(mes_ano=mes_ano, semana=semana)
        serializer = self.get_serializer(despesas_atualizadas, many=True)
        return Response({
            "mensagem": "Distribuição executada com sucesso!",
            "saldo_restante_caixa": str(caixa_disponivel),
            "despesas": serializer.data
        })

    @action(detail=True, methods=['post'], url_path='baixa-parcial')
    def baixa_parcial(self, request, pk=None):
        """Registra um pagamento manual ou baixa parcial em um item específico."""
        despesa = self.get_object()
        valor_adicional = Decimal(str(request.data.get('valor', '0.00')))
        
        if valor_adicional <= 0:
            return Response({"erro": "Valor inválido."}, status=status.HTTP_400_BAD_REQUEST)

        despesa.valor_pago = min(despesa.valor_original, despesa.valor_pago + valor_adicional)
        despesa.calcular_status()
        
        return Response(DespesaSerializer(despesa).data)


class ReceitaSemanalViewSet(viewsets.ModelViewSet):
    serializer_class = ReceitaSemanalSerializer
    permission_classes = [IsAuthenticated]
    queryset = ReceitaSemanal.objects.all()

    