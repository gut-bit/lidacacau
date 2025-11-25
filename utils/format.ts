export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatQuantityWithUnit = (quantity: number, unit: string): string => {
  const unitLabels: Record<string, string> = {
    planta: quantity === 1 ? 'planta' : 'plantas',
    enxerto: quantity === 1 ? 'enxerto' : 'enxertos',
    kg: 'kg',
    ha: 'ha',
    hora: quantity === 1 ? 'hora' : 'horas',
    km: 'km',
  };
  return `${quantity} ${unitLabels[unit] || unit}`;
};

export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return formatDate(dateString);
};

export const getLevelLabel = (level: number): string => {
  return `N${level}`;
};

export const getLevelRequirement = (currentLevel: number): string => {
  const requirements: Record<number, string> = {
    1: 'Precisa de 5 avaliações com média >= 3.5',
    2: 'Precisa de 10 avaliações com média >= 4.0',
    3: 'Precisa de 15 avaliações com média >= 4.3',
    4: 'Precisa de 20 avaliações com média >= 4.5',
    5: 'Nível máximo alcançado!',
  };
  return requirements[currentLevel] || requirements[1];
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    open: 'Aberto',
    assigned: 'Atribuído',
    closed: 'Fechado',
    pending: 'Pendente',
    accepted: 'Aceito',
    rejected: 'Rejeitado',
    checked_in: 'Em Andamento',
    checked_out: 'Aguardando Confirmação',
    completed: 'Concluído',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: string, colors: any): string => {
  const statusColors: Record<string, string> = {
    open: colors.success,
    assigned: colors.warning,
    closed: colors.textSecondary,
    pending: colors.warning,
    accepted: colors.success,
    rejected: colors.error,
    checked_in: colors.primary,
    checked_out: colors.warning,
    completed: colors.success,
  };
  return statusColors[status] || colors.textSecondary;
};
