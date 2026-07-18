package cmpt276.groupproject.books;

import jakarta.validation.constraints.Positive;

public record AddBookRequest(@Positive int gutenbergId) {}
