package cmpt276.groupproject.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

import org.springframework.stereotype.Component;

@Component
public class PasswordHasher {

	private static final int SALT_BYTES = 16;
	private static final String DELIMITER = ":";

	private final SecureRandom secureRandom = new SecureRandom();

	public String hash(String password) {
		byte[] salt = new byte[SALT_BYTES];
		secureRandom.nextBytes(salt);
		String saltHex = HexFormat.of().formatHex(salt);
		return saltHex + DELIMITER + digest(saltHex, password);
	}

	public boolean matches(String password, String hash) {
		if (password == null || hash == null || !hash.contains(DELIMITER)) {
			return false;
		}

		String[] parts = hash.split(DELIMITER, 2);
		if (parts.length != 2) {
			return false;
		}
		return MessageDigest.isEqual(
			digest(parts[0], password).getBytes(StandardCharsets.UTF_8),
			parts[1].getBytes(StandardCharsets.UTF_8)
		);
	}

	private String digest(String saltHex, String password) {
		try {
			MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
			messageDigest.update(saltHex.getBytes(StandardCharsets.UTF_8));
			messageDigest.update(password.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(messageDigest.digest());
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is not available.", exception);
		}
	}
}
