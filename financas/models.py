# financas/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

class CategoriaDespesa(models.TextChoices):
    CONSUMO = 'Consumo', 'Consumo (Luz, Água, Net)'
    OPERACIONAL = 'Operacional', 'Operacional / Loja'
    PESSOAL = 'Pessoal', 'Pessoal / Pró-labore'
    EMPRESTIMOS = 'Empréstimos', 'Empréstimos'
    IMPOSTOS = 'Impostos', 'Impostos / MEI'
    CARTOES = 'Cartões', 'Cartões de Crédito'

class StatusDespesa(models.TextChoices):
    PENDENTE = 'Pendente', 'Pendente'
    PARCIAL = 'Parcial', 'Parcial'
    PAGO = 'Pago', 'Pago'

class Despesa(models.Model):
    mes_ano = models.CharField(max_length=7, default="2026-07", help_text="Formato YYYY-MM")
    semana = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    descricao = models.CharField(max_length=150, verbose_name="Descrição / Nome da Conta")
    dia_vencimento = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(31)])
    valor_original = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    valor_pago = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=10, choices=StatusDespesa.choices, default=StatusDespesa.PENDENTE)
    categoria = models.CharField(max_length=20, choices=CategoriaDespesa.choices, default=CategoriaDespesa.OPERACIONAL)
    observacoes = models.CharField(max_length=255, blank=True, null=True)
    
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['semana', 'dia_vencimento', 'descricao']
        verbose_name = "Despesa"
        verbose_name_plural = "Despesas"

    def __str__(self):
        return f"[Semana {self.semana} - Dia {self.dia_vencimento}] {self.descricao} (R$ {self.valor_original})"

    def calcular_status(self):
        """Atualiza o status com base nos pagamentos registrados."""
        if self.valor_pago >= self.valor_original:
            self.status = StatusDespesa.PAGO
            self.valor_pago = self.valor_original
        elif self.valor_pago > Decimal('0.00'):
            self.status = StatusDespesa.PARCIAL
        else:
            self.status = StatusDespesa.PENDENTE
        self.save()


class ReceitaSemanal(models.Model):
    mes_ano = models.CharField(max_length=7, default="2026-07")
    semana = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('mes_ano', 'semana')
        verbose_name = "Receita Semanal"
        verbose_name_plural = "Receitas Semanais"
        