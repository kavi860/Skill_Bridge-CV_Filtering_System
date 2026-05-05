package com.skillbridge.cvfilter.config;

import com.skillbridge.cvfilter.entity.Candidate;
import com.skillbridge.cvfilter.entity.Vacancy;
import com.skillbridge.cvfilter.repository.CandidateRepository;
import com.skillbridge.cvfilter.repository.VacancyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final VacancyRepository vacancyRepository;
    private final CandidateRepository candidateRepository;

    @Override
    public void run(String... args) throws Exception {
        if (vacancyRepository.count() == 0) {
            Vacancy v1 = new Vacancy("v1", "Senior Frontend Engineer", "React, TypeScript, Tailwind, AI integrations", Arrays.asList("React", "TypeScript", "Tailwind CSS", "Framer Motion"));
            Vacancy v2 = new Vacancy("v2", "Backend Developer (Node.js)", "Node.js, Express, PostgreSQL, Microservices", Arrays.asList("Node.js", "Express", "PostgreSQL", "Microservices", "Redis"));
            Vacancy v3 = new Vacancy("v3", "Product Designer", "Figma, User Research, Design Systems", Arrays.asList("Figma", "User Research", "Prototyping", "Design Systems", "UI/UX"));
            vacancyRepository.saveAll(Arrays.asList(v1, v2, v3));
            System.out.println("Seeded vacancies.");
        }

        if (candidateRepository.count() == 0) {
            Candidate c1 = new Candidate("c1", "Alex Rivera", "alex.rivera@example.com", "Senior Software Engineer with 6 years experience. Expert in React, TypeScript, Tailwind CSS.", 6);
            Candidate c2 = new Candidate("c2", "Sarah Chen", "sarah.chen@example.com", "Full Stack Developer. 4 years React, Node.js, Figma, UI/UX.", 4);
            Candidate c3 = new Candidate("c3", "Marcus Johnson", "marcus.johnson@example.com", "Backend specialist. 8 years Node.js, PostgreSQL, Kubernetes, Microservices.", 8);
            Candidate c4 = new Candidate("c4", "Elena Rodriguez", "elena.rodriguez@example.com", "UI/UX Designer. 5 years Figma, User Research, Design Systems.", 5);
            Candidate c5 = new Candidate("c5", "David Kim", "david.kim@example.com", "Frontend Developer. 3 years React, JavaScript, Tailwind.", 3);
            candidateRepository.saveAll(Arrays.asList(c1, c2, c3, c4, c5));
            System.out.println("Seeded candidates.");
        }
    }
}
