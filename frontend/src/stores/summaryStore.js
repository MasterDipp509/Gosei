import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useDiscussionSummaryStore = defineStore(
    'discussion-summary',
    () => {
        const discussions = ref([
            {
                id: 1,
                slug: 'aetherflow-review',
                title: 'AetherFlow Review',
                category: 'Deep Challenge Stage',
                description:
                    'AI-powered cash flow forecasting for modern B2B SaaS companies.',
                status: 'active',
                createdAt: '2026-07-04T19:30:00',
                verdict: 'Strong Potential',
                confidenceScore: 78,
                previousConfidenceScore: 72,
                coverImage: '/images/discussions/aetherflow.png',

                confidenceTrend: [
                    { label: 'Initial Pitch', value: 52 },
                    { label: 'Market Discussion', value: 67 },
                    { label: 'Technical Review', value: 74 },
                    { label: 'Risk Challenge', value: 69 },
                    { label: 'Current State', value: 78 }
                ],

                risks: [
                    {
                        title: 'Customer Acquisition Cost',
                        raisedBy: 'Lucien Vale',
                        severity: 'high'
                    },
                    {
                        title: 'Onboarding Complexity',
                        raisedBy: 'Mira Hale',
                        severity: 'medium'
                    },
                    {
                        title: 'Data Residency',
                        raisedBy: 'Irene Marlowe',
                        severity: 'medium'
                    }
                ],

                alignment: [
                    {
                        name: 'Kaelen Voss',
                        stance: 'Supportive',
                        score: 82
                    },
                    {
                        name: 'Mira Hale',
                        stance: 'Cautious',
                        score: 68
                    },
                    {
                        name: 'Lucien Vale',
                        stance: 'Skeptical',
                        score: 61
                    },
                    {
                        name: 'Elara Quinn',
                        stance: 'Strong Support',
                        score: 91
                    },
                    {
                        name: 'Irene Marlowe',
                        stance: 'Conditional',
                        score: 64
                    }
                ],

                nextActions: [
                    {
                        title: 'Validate onboarding flow with design partners',
                        priority: 'high',
                        completed: false
                    },
                    {
                        title: 'Run acquisition cost model',
                        priority: 'high',
                        completed: false
                    },
                    {
                        title: 'Review data residency options',
                        priority: 'medium',
                        completed: false
                    },
                    {
                        title: 'Technical feasibility review',
                        priority: 'medium',
                        completed: true
                    },
                    {
                        title: 'Market sizing analysis',
                        priority: 'low',
                        completed: true
                    }
                ],

                moderatorQuote:
                    'The council reinforces your vision, yet questions your assumptions. That is how exceptional ideas are forged.'
            },

            {
                id: 2,
                slug: 'gosei-market-entry',
                title: 'Gosei Market Entry',
                category: 'Strategy Review',
                description:
                    'Evaluating the launch strategy and first target market for Gosei.',
                status: 'active',
                createdAt: '2026-07-03T15:20:00',
                verdict: 'Proceed Carefully',
                confidenceScore: 71,
                previousConfidenceScore: 66,
                coverImage: '/images/discussions/gosei-market.png',

                confidenceTrend: [
                    { label: 'Initial Pitch', value: 47 },
                    { label: 'Market Discussion', value: 59 },
                    { label: 'Technical Review', value: 68 },
                    { label: 'Risk Challenge', value: 63 },
                    { label: 'Current State', value: 71 }
                ],

                risks: [
                    {
                        title: 'Undefined Core Audience',
                        raisedBy: 'Mira Hale',
                        severity: 'high'
                    },
                    {
                        title: 'Feature Overexpansion',
                        raisedBy: 'Lucien Vale',
                        severity: 'high'
                    },
                    {
                        title: 'User Retention',
                        raisedBy: 'Irene Marlowe',
                        severity: 'medium'
                    }
                ],

                alignment: [
                    {
                        name: 'Kaelen Voss',
                        stance: 'Supportive',
                        score: 79
                    },
                    {
                        name: 'Mira Hale',
                        stance: 'Conditional',
                        score: 65
                    },
                    {
                        name: 'Lucien Vale',
                        stance: 'Cautious',
                        score: 58
                    },
                    {
                        name: 'Elara Quinn',
                        stance: 'Supportive',
                        score: 85
                    },
                    {
                        name: 'Irene Marlowe',
                        stance: 'Cautious',
                        score: 67
                    }
                ],

                nextActions: [
                    {
                        title: 'Define primary launch persona',
                        priority: 'high',
                        completed: false
                    },
                    {
                        title: 'Reduce launch feature scope',
                        priority: 'high',
                        completed: false
                    },
                    {
                        title: 'Draft early retention loop',
                        priority: 'medium',
                        completed: false
                    },
                    {
                        title: 'Complete competitor review',
                        priority: 'medium',
                        completed: true
                    }
                ],

                moderatorQuote:
                    'A strong idea becomes dangerous when it attempts to become everything at once.'
            },

            {
                id: 3,
                slug: 'mentor-system-direction',
                title: 'Mentor System Direction',
                category: 'Product Challenge',
                description:
                    'Deciding whether the AI mentor should focus on progression, guidance or companionship.',
                status: 'active',
                createdAt: '2026-07-02T21:10:00',
                verdict: 'Promising Direction',
                confidenceScore: 84,
                previousConfidenceScore: 76,
                coverImage: '/images/discussions/mentor-system.png',

                confidenceTrend: [
                    { label: 'Initial Pitch', value: 61 },
                    { label: 'Market Discussion', value: 70 },
                    { label: 'Technical Review', value: 77 },
                    { label: 'Risk Challenge', value: 74 },
                    { label: 'Current State', value: 84 }
                ],

                risks: [
                    {
                        title: 'Unclear Reward Loop',
                        raisedBy: 'Kaelen Voss',
                        severity: 'medium'
                    },
                    {
                        title: 'Artificial Progression',
                        raisedBy: 'Lucien Vale',
                        severity: 'medium'
                    },
                    {
                        title: 'Mentor Trust',
                        raisedBy: 'Mira Hale',
                        severity: 'high'
                    }
                ],

                alignment: [
                    {
                        name: 'Kaelen Voss',
                        stance: 'Strong Support',
                        score: 91
                    },
                    {
                        name: 'Mira Hale',
                        stance: 'Supportive',
                        score: 83
                    },
                    {
                        name: 'Lucien Vale',
                        stance: 'Conditional',
                        score: 70
                    },
                    {
                        name: 'Elara Quinn',
                        stance: 'Strong Support',
                        score: 94
                    },
                    {
                        name: 'Irene Marlowe',
                        stance: 'Supportive',
                        score: 82
                    }
                ],

                nextActions: [
                    {
                        title: 'Prototype progression path',
                        priority: 'high',
                        completed: false
                    },
                    {
                        title: 'Test mentor response boundaries',
                        priority: 'medium',
                        completed: false
                    },
                    {
                        title: 'Define accomplishment system',
                        priority: 'medium',
                        completed: true
                    }
                ],

                moderatorQuote:
                    'Guidance creates value. Progress creates momentum. The system will need both.'
            },

            {
                id: 4,
                slug: 'council-personality-balance',
                title: 'Council Personality Balance',
                category: 'Experience Review',
                description:
                    'Reviewing how distinct council personalities should challenge the user without becoming predictable.',
                status: 'resolved',
                createdAt: '2026-07-01T18:40:00',
                verdict: 'Well Balanced',
                confidenceScore: 88,
                previousConfidenceScore: 79,
                coverImage: '/images/discussions/council-balance.png',

                confidenceTrend: [
                    { label: 'Initial Pitch', value: 69 },
                    { label: 'Market Discussion', value: 74 },
                    { label: 'Technical Review', value: 81 },
                    { label: 'Risk Challenge', value: 80 },
                    { label: 'Current State', value: 88 }
                ],

                risks: [
                    {
                        title: 'Predictable Responses',
                        raisedBy: 'Irene Marlowe',
                        severity: 'medium'
                    },
                    {
                        title: 'Personality Overlap',
                        raisedBy: 'Elara Quinn',
                        severity: 'low'
                    },
                    {
                        title: 'Forced Disagreement',
                        raisedBy: 'Lucien Vale',
                        severity: 'medium'
                    }
                ],

                alignment: [
                    {
                        name: 'Kaelen Voss',
                        stance: 'Strong Support',
                        score: 93
                    },
                    {
                        name: 'Mira Hale',
                        stance: 'Supportive',
                        score: 86
                    },
                    {
                        name: 'Lucien Vale',
                        stance: 'Supportive',
                        score: 79
                    },
                    {
                        name: 'Elara Quinn',
                        stance: 'Strong Support',
                        score: 95
                    },
                    {
                        name: 'Irene Marlowe',
                        stance: 'Supportive',
                        score: 87
                    }
                ],

                nextActions: [
                    {
                        title: 'Finalize personality boundaries',
                        priority: 'high',
                        completed: true
                    },
                    {
                        title: 'Test disagreement diversity',
                        priority: 'medium',
                        completed: true
                    },
                    {
                        title: 'Review response similarity',
                        priority: 'medium',
                        completed: true
                    }
                ],

                moderatorQuote:
                    'Agreement has value only when disagreement was genuinely possible.'
            },

            {
                id: 5,
                slug: 'subscription-model-review',
                title: 'Subscription Model Review',
                category: 'Business Review',
                description:
                    'Testing the viability of a single paid subscription tier against a freemium structure.',
                status: 'resolved',
                createdAt: '2026-06-29T12:00:00',
                verdict: 'Viable With Revision',
                confidenceScore: 73,
                previousConfidenceScore: 75,
                coverImage: '/images/discussions/subscription.png',

                confidenceTrend: [
                    { label: 'Initial Pitch', value: 63 },
                    { label: 'Market Discussion', value: 72 },
                    { label: 'Technical Review', value: 76 },
                    { label: 'Risk Challenge', value: 66 },
                    { label: 'Current State', value: 73 }
                ],

                risks: [
                    {
                        title: 'Entry Price Resistance',
                        raisedBy: 'Mira Hale',
                        severity: 'high'
                    },
                    {
                        title: 'Weak Free Conversion',
                        raisedBy: 'Kaelen Voss',
                        severity: 'medium'
                    },
                    {
                        title: 'Feature Value Clarity',
                        raisedBy: 'Irene Marlowe',
                        severity: 'medium'
                    }
                ],

                alignment: [
                    {
                        name: 'Kaelen Voss',
                        stance: 'Supportive',
                        score: 80
                    },
                    {
                        name: 'Mira Hale',
                        stance: 'Cautious',
                        score: 64
                    },
                    {
                        name: 'Lucien Vale',
                        stance: 'Conditional',
                        score: 69
                    },
                    {
                        name: 'Elara Quinn',
                        stance: 'Supportive',
                        score: 83
                    },
                    {
                        name: 'Irene Marlowe',
                        stance: 'Conditional',
                        score: 68
                    }
                ],

                nextActions: [
                    {
                        title: 'Define free tier limits',
                        priority: 'high',
                        completed: true
                    },
                    {
                        title: 'Validate willingness to pay',
                        priority: 'high',
                        completed: true
                    },
                    {
                        title: 'Clarify premium value proposition',
                        priority: 'medium',
                        completed: true
                    }
                ],

                moderatorQuote:
                    'Price becomes easier to defend when the value is impossible to misunderstand.'
            },

            {
                id: 6,
                slug: 'guild-progression-system',
                title: 'Guild Progression System',
                category: 'Systems Review',
                description:
                    'Reviewing cooperative progression, rankings and reward structures for guild communities.',
                status: 'resolved',
                createdAt: '2026-06-27T16:15:00',
                verdict: 'Strong Foundation',
                confidenceScore: 81,
                previousConfidenceScore: 74,
                coverImage: '/images/discussions/guild-system.png',

                confidenceTrend: [
                    { label: 'Initial Pitch', value: 58 },
                    { label: 'Market Discussion', value: 69 },
                    { label: 'Technical Review', value: 73 },
                    { label: 'Risk Challenge', value: 71 },
                    { label: 'Current State', value: 81 }
                ],

                risks: [
                    {
                        title: 'Inactive Guild Decay',
                        raisedBy: 'Irene Marlowe',
                        severity: 'medium'
                    },
                    {
                        title: 'Reward Exploitation',
                        raisedBy: 'Lucien Vale',
                        severity: 'high'
                    },
                    {
                        title: 'Rank Anxiety',
                        raisedBy: 'Mira Hale',
                        severity: 'medium'
                    }
                ],

                alignment: [
                    {
                        name: 'Kaelen Voss',
                        stance: 'Strong Support',
                        score: 90
                    },
                    {
                        name: 'Mira Hale',
                        stance: 'Supportive',
                        score: 76
                    },
                    {
                        name: 'Lucien Vale',
                        stance: 'Conditional',
                        score: 72
                    },
                    {
                        name: 'Elara Quinn',
                        stance: 'Strong Support',
                        score: 92
                    },
                    {
                        name: 'Irene Marlowe',
                        stance: 'Supportive',
                        score: 78
                    }
                ],

                nextActions: [
                    {
                        title: 'Define weekly progression rules',
                        priority: 'high',
                        completed: true
                    },
                    {
                        title: 'Create anti-exploit limits',
                        priority: 'high',
                        completed: true
                    },
                    {
                        title: 'Prototype guild reward pool',
                        priority: 'medium',
                        completed: true
                    }
                ],

                moderatorQuote:
                    'Competition should create stories, not punish people for having lives.'
            },

            {
                id: 7,
                slug: 'anime-professional-modes',
                title: 'Anime and Professional Modes',
                category: 'Brand Review',
                description:
                    'Evaluating whether alternate visual modes can serve different users without splitting the product identity.',
                status: 'resolved',
                createdAt: '2026-06-24T20:30:00',
                verdict: 'Distinctive Advantage',
                confidenceScore: 86,
                previousConfidenceScore: 81,
                coverImage: '/images/discussions/visual-modes.png',

                confidenceTrend: [
                    { label: 'Initial Pitch', value: 70 },
                    { label: 'Market Discussion', value: 78 },
                    { label: 'Technical Review', value: 82 },
                    { label: 'Risk Challenge', value: 79 },
                    { label: 'Current State', value: 86 }
                ],

                risks: [
                    {
                        title: 'Brand Fragmentation',
                        raisedBy: 'Mira Hale',
                        severity: 'medium'
                    },
                    {
                        title: 'Theme Maintenance Cost',
                        raisedBy: 'Lucien Vale',
                        severity: 'medium'
                    },
                    {
                        title: 'Feature Parity',
                        raisedBy: 'Irene Marlowe',
                        severity: 'low'
                    }
                ],

                alignment: [
                    {
                        name: 'Kaelen Voss',
                        stance: 'Strong Support',
                        score: 92
                    },
                    {
                        name: 'Mira Hale',
                        stance: 'Supportive',
                        score: 81
                    },
                    {
                        name: 'Lucien Vale',
                        stance: 'Cautious',
                        score: 70
                    },
                    {
                        name: 'Elara Quinn',
                        stance: 'Strong Support',
                        score: 96
                    },
                    {
                        name: 'Irene Marlowe',
                        stance: 'Supportive',
                        score: 84
                    }
                ],

                nextActions: [
                    {
                        title: 'Define shared layout system',
                        priority: 'high',
                        completed: true
                    },
                    {
                        title: 'Separate theme asset packs',
                        priority: 'medium',
                        completed: true
                    },
                    {
                        title: 'Test theme switching flow',
                        priority: 'medium',
                        completed: true
                    }
                ],

                moderatorQuote:
                    'Different atmospheres can share the same soul.'
            },

            {
                id: 8,
                slug: 'launch-scope-review',
                title: 'Launch Scope Review',
                category: 'Critical Challenge',
                description:
                    'Reducing the first public release to the smallest experience that still demonstrates the council concept.',
                status: 'resolved',
                createdAt: '2026-06-21T14:45:00',
                verdict: 'Scope Reduction Required',
                confidenceScore: 67,
                previousConfidenceScore: 70,
                coverImage: '/images/discussions/launch-scope.png',

                confidenceTrend: [
                    { label: 'Initial Pitch', value: 74 },
                    { label: 'Market Discussion', value: 71 },
                    { label: 'Technical Review', value: 65 },
                    { label: 'Risk Challenge', value: 59 },
                    { label: 'Current State', value: 67 }
                ],

                risks: [
                    {
                        title: 'Development Overreach',
                        raisedBy: 'Lucien Vale',
                        severity: 'high'
                    },
                    {
                        title: 'Delayed User Feedback',
                        raisedBy: 'Kaelen Voss',
                        severity: 'high'
                    },
                    {
                        title: 'Incomplete Core Loop',
                        raisedBy: 'Mira Hale',
                        severity: 'medium'
                    }
                ],

                alignment: [
                    {
                        name: 'Kaelen Voss',
                        stance: 'Conditional',
                        score: 69
                    },
                    {
                        name: 'Mira Hale',
                        stance: 'Cautious',
                        score: 62
                    },
                    {
                        name: 'Lucien Vale',
                        stance: 'Skeptical',
                        score: 51
                    },
                    {
                        name: 'Elara Quinn',
                        stance: 'Supportive',
                        score: 78
                    },
                    {
                        name: 'Irene Marlowe',
                        stance: 'Conditional',
                        score: 65
                    }
                ],

                nextActions: [
                    {
                        title: 'Lock MVP feature list',
                        priority: 'high',
                        completed: true
                    },
                    {
                        title: 'Remove secondary social systems',
                        priority: 'high',
                        completed: true
                    },
                    {
                        title: 'Define launch success metrics',
                        priority: 'medium',
                        completed: true
                    }
                ],

                moderatorQuote:
                    'The first release does not need to prove every possibility. It needs to prove one experience matters.'
            }
        ])

        const selectedDiscussionId = ref(1)

        const selectedDiscussion = computed(() => {
            return (
                discussions.value.find(
                    discussion =>
                        discussion.id === selectedDiscussionId.value
                ) ?? discussions.value[0]
            )
        })

        const activeDiscussions = computed(() => {
            return discussions.value.filter(
                discussion => discussion.status === 'active'
            )
        })

        const totalDiscussions = computed(() => {
            return discussions.value.length
        })

        const averageConfidence = computed(() => {
            if (!discussions.value.length) return 0

            const total = discussions.value.reduce(
                (sum, discussion) =>
                    sum + discussion.confidenceScore,
                0
            )

            return Math.round(
                total / discussions.value.length
            )
        })

        const unresolvedIssues = computed(() => {
            return discussions.value.reduce(
                (count, discussion) => {
                    return (
                        count +
                        discussion.nextActions.filter(
                            action => !action.completed
                        ).length
                    )
                },
                0
            )
        })

        const dashboardStats = computed(() => ({
            activeDiscussions: {
                value: activeDiscussions.value.length,
                change: 1,
                period: 'from last week'
            },

            totalDiscussions: {
                value: totalDiscussions.value,
                change: 3,
                period: 'this month'
            },

            averageConfidence: {
                value: averageConfidence.value,
                change: 6,
                period: 'from last month'
            },

            unresolvedIssues: {
                value: unresolvedIssues.value,
                change: -2,
                period: 'from last week'
            }
        }))

        function selectDiscussion(id) {
            const discussion = discussions.value.find(
                item => String(item.id) === String(id)
            )

            if (!discussion) return

            selectedDiscussionId.value = discussion.id
        }

        function nextDiscussion() {
            const currentIndex =
                discussions.value.findIndex(
                    discussion =>
                        discussion.id ===
                        selectedDiscussionId.value
                )

            const nextIndex =
                (currentIndex + 1) %
                discussions.value.length

            selectedDiscussionId.value =
                discussions.value[nextIndex].id
        }

        function previousDiscussion() {
            const currentIndex =
                discussions.value.findIndex(
                    discussion =>
                        discussion.id ===
                        selectedDiscussionId.value
                )

            const previousIndex =
                (
                    currentIndex -
                    1 +
                    discussions.value.length
                ) %
                discussions.value.length

            selectedDiscussionId.value =
                discussions.value[previousIndex].id
        }

        return {
            discussions,
            selectedDiscussionId,

            selectedDiscussion,
            activeDiscussions,
            totalDiscussions,
            averageConfidence,
            unresolvedIssues,
            dashboardStats,

            selectDiscussion,
            nextDiscussion,
            previousDiscussion
        }
    }
)
