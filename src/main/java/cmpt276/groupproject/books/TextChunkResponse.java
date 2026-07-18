package cmpt276.groupproject.books;

import java.util.List;

public record TextChunkResponse(int chunkId, List<String> text, int nextWordIndex, boolean endOfBook) {}
