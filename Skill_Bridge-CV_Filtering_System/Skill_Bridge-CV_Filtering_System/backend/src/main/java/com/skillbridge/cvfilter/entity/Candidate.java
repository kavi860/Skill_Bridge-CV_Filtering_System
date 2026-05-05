package com.skillbridge.cvfilter.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Candidate {

    @Id
    private String id;

    private String name;
    private String email;

    @Column(columnDefinition = "TEXT")
    private String rawText;

    private int experienceYears;
}
