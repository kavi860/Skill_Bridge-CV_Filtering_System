package com.skillbridge.cvfilter.service;

import com.skillbridge.cvfilter.entity.Candidate;
import com.skillbridge.cvfilter.entity.Vacancy;
import com.skillbridge.cvfilter.repository.CandidateRepository;
import com.skillbridge.cvfilter.repository.VacancyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

class CandidateRankingServiceTest {

    @Mock
    private CandidateRepository candidateRepository;

    @Mock
    private VacancyRepository vacancyRepository;

    @InjectMocks
    private CandidateRankingService candidateRankingService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRankCandidatesForVacancy() {
        Vacancy vacancy = new Vacancy("v1", "Title", "Desc", Arrays.asList("Java", "Spring"));
        when(vacancyRepository.findById("v1")).thenReturn(Optional.of(vacancy));

        Candidate c1 = new Candidate("c1", "John", "john@ex.com", "I know Java and Spring Boot.", 3);
        Candidate c2 = new Candidate("c2", "Jane", "jane@ex.com", "I only know Java.", 2);
        when(candidateRepository.findAll()).thenReturn(Arrays.asList(c1, c2));

        List<Map<String, Object>> result = candidateRankingService.rankCandidatesForVacancy("v1");

        assertEquals(2, result.size());
        assertEquals(100, result.get(0).get("matchScore")); // John has Java and Spring
        assertEquals("c1", result.get(0).get("id"));
        
        assertEquals(50, result.get(1).get("matchScore")); // Jane has only Java
        assertEquals("c2", result.get(1).get("id"));
    }
}
