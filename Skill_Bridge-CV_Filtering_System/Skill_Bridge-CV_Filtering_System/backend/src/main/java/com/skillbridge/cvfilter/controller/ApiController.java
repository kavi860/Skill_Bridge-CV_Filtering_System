package com.skillbridge.cvfilter.controller;

import com.skillbridge.cvfilter.entity.Vacancy;
import com.skillbridge.cvfilter.service.CandidateRankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ApiController {

    private final CandidateRankingService candidateRankingService;

    @GetMapping("/vacancies")
    public List<Vacancy> getVacancies() {
        return candidateRankingService.getAllVacancies();
    }

    @GetMapping("/candidates/rank/{vacancyId}")
    public List<Map<String, Object>> getRankedCandidates(@PathVariable String vacancyId) {
        return candidateRankingService.rankCandidatesForVacancy(vacancyId);
    }
}
