// MetaPrivacyService.kt
// DOGE Spatial Explorer — Privacy Service for Meta Quest
//
// Provides encryption, secure storage, and privacy zone
// enforcement on Meta Quest devices.

package com.doge.spatial.services

import android.content.Context
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class MetaPrivacyService(private val context: Context) {

    companion object {
        private const val TAG = "MetaPrivacyService"
        private const val GCM_TAG_LENGTH = 128
        private const val GCM_IV_LENGTH = 12
        private const val KEY_ALIAS = "doge_spatial_master_key"
        private const val PREFS_NAME = "doge_spatial_encrypted_prefs"
    }

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val encryptedPrefs = EncryptedSharedPreferences.create(
        context,
        PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    // ── Key Management ──────────────────────────────────────────────────

    fun generateDocumentKey(documentId: String): SecretKey {
        val keyGen = KeyGenerator.getInstance("AES")
        keyGen.init(256)
        val key = keyGen.generateKey()

        // Store encrypted in SharedPreferences
        val keyBytes = key.encoded
        encryptedPrefs.edit()
            .putString("doc_key_$documentId", android.util.Base64.encodeToString(keyBytes, android.util.Base64.NO_WRAP))
            .apply()

        Log.i(TAG, "Generated AES-256 key for document $documentId")
        return key
    }

    fun getDocumentKey(documentId: String): SecretKey? {
        val encoded = encryptedPrefs.getString("doc_key_$documentId", null) ?: return null
        val keyBytes = android.util.Base64.decode(encoded, android.util.Base64.NO_WRAP)
        return javax.crypto.spec.SecretKeySpec(keyBytes, "AES")
    }

    // ── Encryption / Decryption ─────────────────────────────────────────

    fun encrypt(data: ByteArray, key: SecretKey): EncryptedData {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key)

        val iv = cipher.iv
        val ciphertext = cipher.doFinal(data)

        return EncryptedData(
            ciphertext = ciphertext,
            iv = iv,
            tagLength = GCM_TAG_LENGTH
        )
    }

    fun decrypt(encrypted: EncryptedData, key: SecretKey): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val spec = GCMParameterSpec(encrypted.tagLength, encrypted.iv)
        cipher.init(Cipher.DECRYPT_MODE, key, spec)

        return cipher.doFinal(encrypted.ciphertext)
    }

    // ── Auth Token ──────────────────────────────────────────────────────

    fun getAuthToken(): String {
        return encryptedPrefs.getString("auth_token", "") ?: ""
    }

    fun setAuthToken(token: String) {
        encryptedPrefs.edit().putString("auth_token", token).apply()
    }
}

data class EncryptedData(
    val ciphertext: ByteArray,
    val iv: ByteArray,
    val tagLength: Int
)
