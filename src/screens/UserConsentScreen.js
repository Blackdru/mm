import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';

const UserConsentScreen = ({ navigation, route }) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedLocation, setConfirmedLocation] = useState(false);
  const { onAccept } = route.params;

  const handleAccept = () => {
    if (!agreedToTerms || !confirmedLocation) {
      Alert.alert('Consent Required', 'Please accept both terms to continue');
      return;
    }
    onAccept();
  };

  const restrictedStates = [
    'Telangana', 'Andhra Pradesh', 'Assam', 'Nagaland', 'Sikkim'
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>⚖️ User Consent</Text>
            <Text style={styles.subtitle}>
              Please read and accept the terms below
            </Text>
          </View>

          <View style={[commonStyles.attractiveCard, styles.consentCard]}>
            <Text style={styles.sectionTitle}>🎮 Real Money Gaming Disclaimer</Text>
            <Text style={styles.consentText}>
              This is a real money gaming application where you can win or lose actual money. 
              While our games are completely skill-based, there are inherent risks involved:
            </Text>
            
            <View style={styles.riskList}>
              <Text style={styles.riskItem}>• You may lose the money you deposit</Text>
              <Text style={styles.riskItem}>• Gaming can be addictive - play responsibly</Text>
              <Text style={styles.riskItem}>• Only deposit what you can afford to lose</Text>
              <Text style={styles.riskItem}>• Outcomes depend on your skill and strategy</Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I understand the risks and agree to the terms of real money gaming
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[commonStyles.attractiveCard, styles.consentCard]}>
            <Text style={styles.sectionTitle}>📍 Location Confirmation</Text>
            <Text style={styles.consentText}>
              Real money gaming is not permitted in the following Indian states:
            </Text>
            
            <View style={styles.statesList}>
              {restrictedStates.map((state, index) => (
                <Text key={index} style={styles.stateItem}>• {state}</Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setConfirmedLocation(!confirmedLocation)}>
              <View style={[styles.checkbox, confirmedLocation && styles.checkboxChecked]}>
                {confirmedLocation && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I confirm that I am NOT a resident of any of the above-mentioned states
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Important Notice</Text>
            <Text style={styles.warningText}>
              By proceeding, you acknowledge that you are 18+ years old, understand the risks 
              of real money gaming, and confirm your location eligibility. Play responsibly!
            </Text>
          </View>

          <TouchableOpacity
            style={[
              commonStyles.largeButton,
              (!agreedToTerms || !confirmedLocation) && styles.buttonDisabled
            ]}
            onPress={handleAccept}
            disabled={!agreedToTerms || !confirmedLocation}>
            <Text style={commonStyles.largeButtonText}>
              ✅ I Accept & Continue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.declineText}>❌ I Decline</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  consentCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  consentText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  riskList: {
    marginBottom: theme.spacing.lg,
  },
  riskItem: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
  },
  statesList: {
    marginBottom: theme.spacing.lg,
  },
  stateItem: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.danger,
    marginBottom: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  checkmark: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
  },
  warningCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  warningTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.warning,
    marginBottom: theme.spacing.sm,
  },
  warningText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.textLight,
    opacity: 0.5,
  },
  declineButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  declineText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.danger,
    fontWeight: '600',
  },
});

export default UserConsentScreen;