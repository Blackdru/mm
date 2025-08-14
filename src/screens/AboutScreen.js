import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';

const AboutScreen = ({ navigation }) => {
  const features = [
    {
      icon: '🧠',
      title: 'Skill-Based Gaming',
      description: 'Test your memory and strategic thinking in exciting card matching battles.',
    },
    {
      icon: '💰',
      title: 'Real Money Prizes',
      description: 'Win real cash prizes by showcasing your gaming skills against other players.',
    },
    {
      icon: '🔒',
      title: 'Secure & Safe',
      description: 'Bank-grade security ensures your money and personal data are always protected.',
    },
    {
      icon: '⚡',
      title: 'Instant Payouts',
      description: 'Quick and hassle-free withdrawals to your bank account or UPI.',
    },
    {
      icon: '🎮',
      title: 'Fair Play',
      description: 'Advanced anti-cheat systems ensure every game is fair and competitive.',
    },
    {
      icon: '🏆',
      title: 'Competitive Tournaments',
      description: 'Participate in daily tournaments and climb the leaderboards for bigger rewards.',
    },
  ];

  const teamMembers = [
    {
      name: 'Development Team',
      role: 'Building the future of mobile gaming',
      icon: '👨‍💻',
    },
    {
      name: 'Security Team',
      role: 'Ensuring safe and secure gaming',
      icon: '🛡️',
    },
    {
      name: 'Support Team',
      role: '24/7 customer assistance',
      icon: '🎧',
    },
  ];

  const handleSocialLink = (url) => {
    Linking.openURL(url).catch(() => {
      console.log('Failed to open URL');
    });
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <CommonHeader
          title="About Budzee"
          subtitle="Learn more about our gaming platform"
          icon="ℹ️"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🎮</Text>
            </View>
            <Text style={styles.appName}>BUDZEE GAMING</Text>
            <Text style={styles.tagline}>Where Skills Meet Rewards</Text>
          </View>

          {/* Mission Section */}
          <View style={[commonStyles.attractiveCard, styles.missionCard]}>
            <Text style={styles.sectionTitle}>🎯 Our Mission</Text>
            <Text style={styles.missionText}>
              To create the most engaging and rewarding skill-based gaming platform where players can 
              showcase their abilities, compete fairly, and earn real money while having fun.
            </Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>✨ What Makes Us Special</Text>
            <View style={styles.featuresList}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Text style={styles.featureIconText}>{feature.icon}</Text>
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Team Section */}
          <View style={styles.teamSection}>
            <Text style={styles.sectionTitle}>👥 Our Team</Text>
            <View style={styles.teamList}>
              {teamMembers.map((member, index) => (
                <View key={index} style={styles.teamMember}>
                  <Text style={styles.teamIcon}>{member.icon}</Text>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{member.name}</Text>
                    <Text style={styles.teamRole}>{member.role}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Stats Section */}
          <View style={[commonStyles.attractiveCard, styles.statsCard]}>
            <Text style={styles.sectionTitle}>📊 Platform Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>10K+</Text>
                <Text style={styles.statLabel}>Active Players</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₹50L+</Text>
                <Text style={styles.statLabel}>Prizes Won</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>99.9%</Text>
                <Text style={styles.statLabel}>Uptime</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>4.8★</Text>
                <Text style={styles.statLabel}>User Rating</Text>
              </View>
            </View>
          </View>

          {/* Social Links */}
          <View style={styles.socialSection}>
            <Text style={styles.sectionTitle}>🌐 Connect With Us</Text>
            <View style={styles.socialLinks}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialLink('https://twitter.com/budzee')}>
                <Text style={styles.socialIcon}>🐦</Text>
                <Text style={styles.socialText}>Twitter</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialLink('https://instagram.com/budzee')}>
                <Text style={styles.socialIcon}>📷</Text>
                <Text style={styles.socialText}>Instagram</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialLink('https://discord.gg/budzee')}>
                <Text style={styles.socialIcon}>💬</Text>
                <Text style={styles.socialText}>Discord</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal Section */}
          <View style={styles.legalSection}>
            <Text style={styles.legalTitle}>📋 Legal Information</Text>
            <Text style={styles.legalText}>
              Budzee Gaming is a skill-based gaming platform. All games are based on skill and strategy, 
              not chance. We comply with all applicable laws and regulations.
            </Text>
            <Text style={styles.legalText}>
              Players must be 18+ years old to participate. Please play responsibly.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2024 Budzee Gaming. All rights reserved.
            </Text>
            <Text style={styles.copyright}>
              Budrock Technologies Private Limited
            </Text>
          </View>
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

  heroSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.primaryShadow,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.accent,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  version: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  missionCard: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  missionText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },

  featuresSection: {
    marginBottom: theme.spacing.xl,
  },
  featuresList: {
    gap: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  teamSection: {
    marginBottom: theme.spacing.xl,
  },
  teamList: {
    gap: theme.spacing.md,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  teamIcon: {
    fontSize: 30,
    marginRight: theme.spacing.md,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  teamRole: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },

  statsCard: {
    marginBottom: theme.spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
    width: '45%',
  },
  statValue: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  socialSection: {
    marginBottom: theme.spacing.xl,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing.sm,
  },
  socialButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  socialIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.sm,
  },
  socialText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  legalSection: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  legalTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  legalText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  copyright: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});

export default AboutScreen;