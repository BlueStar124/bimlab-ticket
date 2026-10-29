package com.bimlab.ticket.note;

/** The link is already on the board; the API answers 409 with a message naming the existing note. */
public class DuplicateLinkException extends RuntimeException {
    public DuplicateLinkException(String message) { super(message); }
}
