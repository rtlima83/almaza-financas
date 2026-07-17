# financas/serializers.py
from rest_framework import serializers
from .models import Despesa, ReceitaSemanal
from decimal import Decimal

class DespesaSerializer(serializers.ModelSerializer):
    saldo_restante = serializers.SerializerMethodField()

    class Meta:
        model = Despesa
        fields = [
            'id', 'mes_ano', 'semana', 'descricao', 'dia_vencimento', 
            'valor_original', 'valor_pago', 'saldo_restante', 
            'status', 'categoria', 'observacoes'
        ]
        read_only_fields = ['status', 'saldo_restante']

    def get_saldo_restante(self, obj):
        return max(Decimal('0.00'), obj.valor_original - obj.valor_pago)

    def create(self, validated_data):
        despesa = Despesa.objects.create(**validated_data)
        despesa.calcular_status()
        return despesa

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.calcular_status()
        return instance


class ReceitaSemanalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceitaSemanal
        fields = ['id', 'mes_ano', 'semana', 'valor', 'atualizado_em']
        