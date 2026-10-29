package com.bimlab.ticket.auth;

import org.springframework.data.jpa.repository.JpaRepository;

interface TeamAccountRepository extends JpaRepository<TeamAccount, String> {}
