// build.gradle.kts
// DOGE Spatial Explorer — Meta Quest / Horizon OS Application
//
// Uses Meta Spatial SDK for mixed reality features on Meta Quest 3/3S/Pro.
// Cross-platform collaboration with visionOS users via the shared
// cloud backend and WebSocket protocol.

plugins {
    id("com.android.application") version "8.7.0"
    id("org.jetbrains.kotlin.android") version "2.1.0"
    id("org.jetbrains.kotlin.plugin.serialization") version "2.1.0"
    id("com.meta.spatial.plugin") version "0.7.0"
}

android {
    namespace = "com.doge.spatial"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.doge.spatial.explorer"
        minSdk = 32 // Meta Horizon OS minimum
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField("String", "CLOUD_BASE_URL", "\"https://api.doge-spatial.example.com\"")
        buildConfigField("String", "WS_URL", "\"wss://api.doge-spatial.example.com/ws\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Meta Spatial SDK
    implementation("com.meta.spatial:spatial-sdk:0.7.0")
    implementation("com.meta.spatial:spatial-sdk-physics:0.7.0")
    implementation("com.meta.spatial:spatial-sdk-toolkit:0.7.0")
    implementation("com.meta.spatial:spatial-sdk-mruk:0.7.0") // Mixed Reality Utility Kit
    implementation("com.meta.spatial:spatial-sdk-isdk:0.7.0") // Interaction SDK

    // OpenXR
    implementation("org.khronos.openxr:openxr-sdk:1.1.0")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // Networking
    implementation("io.ktor:ktor-client-android:3.0.0")
    implementation("io.ktor:ktor-client-websockets:3.0.0")
    implementation("io.ktor:ktor-client-content-negotiation:3.0.0")
    implementation("io.ktor:ktor-serialization-kotlinx-json:3.0.0")

    // glTF/USD loading
    implementation("io.github.niclaslindstedt:gltf-loader:2.0.0")

    // Compose for UI panels
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.runtime:runtime")

    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")

    // Security / Encryption
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
}
