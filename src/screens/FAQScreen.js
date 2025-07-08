import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';

const FAQScreen = ({ navigation }) => {
  const [expandedItems, setExpandedItems] = useState({});

  const faqData = [
    {
      id: 1,
      question: 'How do I add money to my wallet?',
      answer: 'Go to the Wallet section and tap "Add Money". You can add funds using UPI, cards, or net banking through our secure payment gateway.',
    },
    {
      id: 2,
      question: 'How do withdrawals work?',
      answer: 'You can withdraw your winnings to your bank account or UPI ID. Minimum withdrawal is ₹100 and processing takes 1-3 business days.',
    },
    {
      id: 3,
      question: 'Is Budzee safe and secure?',
      answer: 'Yes! We use bank-grade security, encrypted transactions, and follow all regulatory guidelines. Your money and data are completely safe.',
    },
    {
      id: 4,
      question: 'How does the Memory Game work?',
      answer: 'Match pairs of cards by remembering their positions. The player with the most matches wins. Entry fees start from ₹5 and winner takes 80% of the prize pool.',
    },
    {
      id: 5,
      question: 'What happens if I lose connection during a game?',
      answer: 'If you lose connection, you have 30 seconds to reconnect. If you can\'t reconnect, the game continues and your entry fee may be refunded based on the situation.',
    },
    {
      id: 6,
      question: 'How do I invite friends?',
      answer: 'Use the Referral section to share your unique code. When friends join and play, you both earn bonus rewards!',
    },
    {
      id: 7,
      question: 'Are there any charges for deposits or withdrawals?',
      answer: 'Deposits are free. Withdrawals are also free, but your bank or payment provider may charge their own fees.',
    },
    {
      id: 8,
      question: 'What if I face technical issues?',
      answer: 'Contact our 24/7 support team through the app or email support@budzee.com. We\'ll resolve your issue quickly.',
    },
    {
      id: 9,
      question: 'Can I play multiple games simultaneously?',
      answer: 'No, you can only play one game at a time to ensure fair play and your full attention to each match.',
    },
    {
      id: 10,
      question: 'How are winners determined?',
      answer: 'Winners are determined by game performance. In Memory Game, the player with the most matched pairs wins. All games are skill-based.',
    },
  ];

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderFAQItem = (item) => {
    const isExpanded = expandedItems[item.id];
    
    return (
      <View key={item.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.questionContainer}
          onPress={() => toggleExpanded(item.id)}
        >
          <Text style={styles.questionText}>{item.question}</Text>
          <Text style={[styles.expandIcon, isExpanded && styles.expandedIcon]}>
            {isExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerText}>{item.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <CommonHeader
          title="FAQ"
          subtitle="Frequently Asked Questions"
          icon="❓"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Got Questions? We've Got Answers!</Text>
            <Text style={styles.introText}>
              Find quick answers to common questions about Budzee Gaming.
            </Text>
          </View>

          <View style={styles.faqList}>
            {faqData.map(renderFAQItem)}
          </View>

          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Still Need Help?</Text>
            <Text style={styles.contactText}>
              Can't find what you're looking for? Our support team is here to help!
            </Text>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>📧 Contact Support</Text>
            </TouchableOpacity>
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

  introSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  introTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  introText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  faqList: {
    marginBottom: theme.spacing.xl,
  },
  faqItem: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  questionText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.md,
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    width: 24,
    textAlign: 'center',
  },
  expandedIcon: {
    color: theme.colors.secondary,
  },
  answerContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  answerText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginTop: theme.spacing.sm,
  },

  contactSection: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contactTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  contactText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.primaryShadow,
  },
  contactButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});

export default FAQScreen;