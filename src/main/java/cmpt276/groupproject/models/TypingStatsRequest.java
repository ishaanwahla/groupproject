package cmpt276.groupproject.models;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class TypingStatsRequest {

	@NotNull(message = "WPM is required.")
	@Min(value = 0, message = "WPM must be zero or greater.")
	private Integer wpm;

	@NotNull(message = "Accuracy is required.")
	@Min(value = 0, message = "Accuracy must be zero or greater.")
	private Integer accuracy;

	private boolean completed;

	@Min(value = 0, message = "Words typed must be zero or greater.")
	private Integer wordsTyped;

	@Min(value = 0, message = "Mistakes must be zero or greater.")
	private Integer mistakes;

	public Integer getWpm() {
		return wpm;
	}

	public void setWpm(Integer wpm) {
		this.wpm = wpm;
	}

	public Integer getAccuracy() {
		return accuracy;
	}

	public void setAccuracy(Integer accuracy) {
		this.accuracy = accuracy;
	}

	public boolean isCompleted() {
		return completed;
	}

	public void setCompleted(boolean completed) {
		this.completed = completed;
	}

	public Integer getWordsTyped() {
		return wordsTyped;
	}

	public void setWordsTyped(Integer wordsTyped) {
		this.wordsTyped = wordsTyped;
	}

	public Integer getMistakes() {
		return mistakes;
	}

	public void setMistakes(Integer mistakes) {
		this.mistakes = mistakes;
	}
}
