package com.bimlab.ticket.ticket;

public class TicketNotFoundException extends RuntimeException {
    public TicketNotFoundException() { super("Không tìm thấy ticket"); }
}
