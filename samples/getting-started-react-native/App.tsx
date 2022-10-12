import React from "react";
import { StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { GettingStartedReactNative } from "./src/getting-started-react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingViewContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <GettingStartedReactNative />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingViewContainer: {
    flex: 1,
  },
});
