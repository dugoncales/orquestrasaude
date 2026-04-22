import { useAlerts } from "@/hooks/useAlerts";
import { useAppointments } from "@/hooks/useAppointments";
import { useTasks } from "@/hooks/useTasks";

export function useProfessionalActionQueue() {
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments();
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: alertsData, isLoading: alertsLoading } = useAlerts();

  const allAppointments = appointmentsData || [];
  const allTasks = tasksData || [];
  const allAlerts = alertsData || [];

  const todayAppointments = allAppointments.filter(
    (a) => a.status === "agendada" || a.status === "realizada",
  );

  const dayTasks = allTasks.filter(
    (t) => t.status === "pendente" || t.status === "atrasada" || t.status === "em_andamento",
  );

  const faltosos = allAppointments.filter((a) => a.status === "faltou");
  const clinicalAlerts = allAlerts.filter((a) => !a.lido && a.tipo === "clinico");
  const operationalAlerts = allAlerts.filter((a) => !a.lido && a.tipo === "operacional");
  const criticalAlerts = allAlerts.filter((a) => !a.lido && a.severidade === "critical");

  return {
    isLoading: appointmentsLoading || tasksLoading || alertsLoading,
    allAppointments,
    allTasks,
    allAlerts,
    todayAppointments,
    dayTasks,
    faltosos,
    clinicalAlerts,
    operationalAlerts,
    criticalAlerts,
  };
}
