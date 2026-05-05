package com.skillbridge.cvfilter.service;

import com.skillbridge.cvfilter.entity.Candidate;
import com.skillbridge.cvfilter.entity.Vacancy;
import com.skillbridge.cvfilter.repository.CandidateRepository;
import com.skillbridge.cvfilter.repository.VacancyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CandidateRankingService {

    private final CandidateRepository candidateRepository;
    private final VacancyRepository vacancyRepository;

    public List<Vacancy> getAllVacancies() {
        return vacancyRepository.findAll();
    }

    public List<Map<String, Object>> rankCandidatesForVacancy(String vacancyId) {
        Vacancy vacancy = vacancyRepository.findById(vacancyId)
                .orElseThrow(() -> new RuntimeException("Vacancy not found"));
        
        List<Candidate> candidates = candidateRepository.findAll();
        List<Map<String, Object>> rankedCandidates = new ArrayList<>();

        for (Candidate c : candidates) {
            Map<String, Object> analysis = computeMatchScore(c.getRawText(), vacancy.getRequiredSkills());
            
            Map<String, Object> candidateMap = new HashMap<>();
            candidateMap.put("id", c.getId());
            candidateMap.put("name", c.getName());
            candidateMap.put("email", c.getEmail());
            candidateMap.put("rawText", c.getRawText());
            candidateMap.put("experienceYears", c.getExperienceYears());
            candidateMap.put("matchScore", analysis.get("score"));
            candidateMap.put("skills", analysis.get("found"));
            
            rankedCandidates.add(candidateMap);
        }

        // Sort by matchScore descending
        rankedCandidates.sort((a, b) -> {
            Integer scoreA = (Integer) a.get("matchScore");
            Integer scoreB = (Integer) b.get("matchScore");
            return scoreB.compareTo(scoreA);
        });

        return rankedCandidates;
    }

    private Map<String, Object> computeMatchScore(String text, List<String> skills) {
        String lowerText = text.toLowerCase();
        int hits = 0;
        List<String> found = new ArrayList<>();
        
        for (String s : skills) {
            if (lowerText.contains(s.toLowerCase())) {
                hits++;
                found.add(s);
            }
        }
        
        int score = skills.isEmpty() ? 0 : Math.round(((float) hits / skills.size()) * 100);
        
        Map<String, Object> result = new HashMap<>();
        result.put("score", score);
        result.put("found", found);
        return result;
    }
}
