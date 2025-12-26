export interface CreateTicketDto {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  labels?: string[];
  organizationId: string;
}

export interface TicketIntegration {
  createTicket(dto: CreateTicketDto): Promise<string | null>; // Returns Ticket Key or null
  getTicketStatus(ticketId: string): Promise<string>;
}
