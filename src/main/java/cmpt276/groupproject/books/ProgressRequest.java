package cmpt276.groupproject.books;

import jakarta.validation.constraints.PositiveOrZero;

public record ProgressRequest(@PositiveOrZero int currentWordIndex) {}
