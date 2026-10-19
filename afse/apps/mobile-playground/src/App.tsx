import { useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AfseForm, AfseProvider, AfseSubmissionView, useAfseForm } from 'afse-formio-react-native';
import { onboardingWizard, paymentForm, type Payment } from './forms';

type Screen = 'payment' | 'wizard';

export function App() {
  const [screen, setScreen] = useState<Screen>('payment');
  const [language, setLanguage] = useState<'en' | 'el'>('en');

  return (
    <SafeAreaProvider>
      <AfseProvider language={language} theme={{ primaryColor: '#0b3d91' }}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <StatusBar style="light" />
          <View style={styles.header}>
            <Text style={styles.title}>AFSE Forms</Text>
            <Pressable testID="toggle-language" onPress={() => setLanguage(language === 'en' ? 'el' : 'en')}>
              <Text style={styles.headerLink}>{language === 'en' ? 'Ελληνικά' : 'English'}</Text>
            </Pressable>
          </View>
          <View style={styles.tabs}>
            {(['payment', 'wizard'] as const).map((s) => (
              <Pressable key={s} testID={`tab-${s}`} onPress={() => setScreen(s)} style={[styles.tab, s === screen && styles.tabActive]}>
                <Text style={[styles.tabText, s === screen && styles.tabTextActive]}>{s === 'payment' ? 'Payment' : 'Onboarding'}</Text>
              </Pressable>
            ))}
          </View>
          {screen === 'payment' ? <PaymentScreen /> : <AfseForm form={onboardingWizard} testID="wizard-form" />}
        </SafeAreaView>
      </AfseProvider>
    </SafeAreaProvider>
  );
}

function PaymentScreen() {
  const form = useAfseForm<Payment>();
  const [paid, setPaid] = useState<Payment | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  if (paid) {
    return (
      <View style={styles.fill}>
        <Text style={styles.success} testID="payment-done">
          Payment sent ✓
        </Text>
        <AfseSubmissionView form={paymentForm} data={paid} />
        <Button title="New payment" onPress={() => setPaid(null)} />
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <AfseForm<Payment>
        ref={form.ref}
        form={paymentForm}
        testID="payment-form"
        onSubmit={({ data }) => setPaid(data)}
        onValidationError={(errors) => setErrorCount(errors.length)}
      />
      <View style={styles.footer}>
        <Text testID="error-count">{errorCount ? `${errorCount} field(s) need attention` : ' '}</Text>
        <Button
          title="Fill sample"
          onPress={() => form.setData({ beneficiary: 'ACME Hellas', iban: 'GR16 0110 1250 0000 0001 2300 695', amount: 250 })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b3d91' },
  fill: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '600' },
  headerLink: { color: '#fff', fontSize: 16 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: '#fff' },
  tabTextActive: { color: '#0b3d91' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff' },
  success: { fontSize: 18, fontWeight: '600', color: '#05603a', padding: 16 },
});
