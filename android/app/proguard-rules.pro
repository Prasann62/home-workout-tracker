# ============================================================
# ILA — ProGuard / R8 Rules
# ============================================================
# R8 is the replacement for ProGuard. Most rules below are
# Capacitor / WebView / Coroutines safe-keeps.
# ============================================================

# ── Capacitor WebView Bridge (MUST keep) ─────────────────────
# Capacitor's JS↔Native bridge uses reflection to invoke methods
# annotated with @PluginMethod. If R8 renames these, the bridge breaks.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PluginMethod public *;
}

# ── AndroidX Core (keep crash-safe) ──────────────────────────
-keep class androidx.core.app.** { *; }

# ── Coroutines: strip debug probes (AUDIT FIX) ───────────────
# DebugProbesKt.bin is coroutines debug metadata — dead weight
# in a release build. R8 strips it when minification is on.
-assumenosideeffects class kotlin.coroutines.jvm.internal.DebugProbesKt {
    public static ** probeCoroutineCreated(...);
    public static ** probeCoroutineResumed(...);
    public static ** probeCoroutineSuspended(...);
}

# ── Kotlin metadata (keep for reflection) ────────────────────
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# ── Kotlin standard library ───────────────────────────────────
-dontwarn kotlin.**
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }

# ── Prevent stripping enum types ──────────────────────────────
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ── Serializable classes ──────────────────────────────────────
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ── FileProvider (used by Capacitor) ─────────────────────────
-keep class androidx.core.content.FileProvider { *; }

# ── Suppress noisy library warnings ──────────────────────────
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
-dontwarn com.google.android.gms.**
