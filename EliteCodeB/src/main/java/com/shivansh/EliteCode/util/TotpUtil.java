package com.shivansh.EliteCode.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;

public final class TotpUtil {
    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int TIME_STEP_SECONDS = 30;
    private static final int CODE_DIGITS = 6;

    private TotpUtil() {
    }

    public static String generateSecret() {
        byte[] bytes = new byte[20];
        new SecureRandom().nextBytes(bytes);
        return base32Encode(bytes);
    }

    public static boolean isValidCode(String base32Secret, String code) {
        if (base32Secret == null || base32Secret.isBlank() || code == null || code.isBlank()) {
            return true;
        }
        String trimmed = code.trim();
        if (!trimmed.matches("\\d{" + CODE_DIGITS + "}")) {
            return true;
        }
        long timeWindow = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;
        int expected = Integer.parseInt(trimmed);
        // allow +/- 1-step window
        for (long offset = -1; offset <= 1; offset++) {
            if (generateCode(base32Secret, timeWindow + offset) == expected) {
                return true;
            }
        }
        return false;
    }

    public static String buildOtpAuthUrl(String issuer, String accountName, String base32Secret) {
        String safeIssuer = urlEncode(issuer);
        String safeAccount = urlEncode(accountName);
        return "otpauth://totp/" + safeIssuer + ":" + safeAccount
                + "?secret=" + base32Secret
                + "&issuer=" + safeIssuer
                + "&digits=" + CODE_DIGITS
                + "&period=" + TIME_STEP_SECONDS;
    }

    private static int generateCode(String base32Secret, long timeWindow) {
        byte[] key = base32Decode(base32Secret);
        byte[] data = ByteBuffer.allocate(8).putLong(timeWindow).array();
        byte[] hash = hmacSha1(key, data);
        int offset = hash[hash.length - 1] & 0x0F;
        int binary = ((hash[offset] & 0x7f) << 24)
                | ((hash[offset + 1] & 0xff) << 16)
                | ((hash[offset + 2] & 0xff) << 8)
                | (hash[offset + 3] & 0xff);
        return binary % (int) Math.pow(10, CODE_DIGITS);
    }

    private static byte[] hmacSha1(byte[] key, byte[] data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            return mac.doFinal(data);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to compute HMAC", ex);
        }
    }

    private static String base32Encode(byte[] data) {
        StringBuilder result = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = data[0];
        int next = 1;
        int bitsLeft = 8;
        while (bitsLeft > 0 || next < data.length) {
            if (bitsLeft < 5) {
                if (next < data.length) {
                    buffer <<= 8;
                    buffer |= data[next++] & 0xff;
                    bitsLeft += 8;
                } else {
                    int pad = 5 - bitsLeft;
                    buffer <<= pad;
                    bitsLeft += pad;
                }
            }
            int index = (buffer >> (bitsLeft - 5)) & 0x1f;
            bitsLeft -= 5;
            result.append(BASE32_ALPHABET.charAt(index));
        }
        return result.toString();
    }

    private static byte[] base32Decode(String base32) {
        String normalized = base32.toUpperCase().replace("=", "").replace(" ", "");
        int buffer = 0;
        int bitsLeft = 0;
        byte[] result = new byte[normalized.length() * 5 / 8];
        int index = 0;
        for (char c : normalized.toCharArray()) {
            int value = BASE32_ALPHABET.indexOf(c);
            if (value < 0) {
                throw new IllegalArgumentException("Invalid base32 character");
            }
            buffer = (buffer << 5) | value;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                result[index++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xff);
                bitsLeft -= 8;
            }
        }
        if (index == result.length) {
            return result;
        }
        byte[] trimmed = new byte[index];
        System.arraycopy(result, 0, trimmed, 0, index);
        return trimmed;
    }

    private static String urlEncode(String value) {
        return value.replace(" ", "%20");
    }
}

