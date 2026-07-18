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
}
