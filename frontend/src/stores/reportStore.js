// src/stores/reportStore.js

import { defineStore } from 'pinia'

import api from '@/services/api.js'


function cloneValue(value) {
    if (value === undefined) {
        return undefined
    }

    if (value === null) {
        return null
    }

    return JSON.parse(JSON.stringify(value))
}


function asArray(value) {
    return Array.isArray(value) ? value : []
}


function asObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {}
}


function normalizeId(value) {
    if (value === null || value === undefined || value === '') {
        return null
    }

    return String(value)
}


function createEmptyReport() {
    return {
        session: null,

        executiveSummary: '',
        finalVerdict: '',
        mediatorFinalSummary: '',

        finalConfidence: null,

        finalRisks: [],
        finalActions: [],
        unresolvedPoints: [],
        importantNotes: [],

        rounds: [],
        turningPoints: [],

        generatedAt: null,
        updatedAt: null
    }
}


function normalizeReport(payload = {}) {
    const report = asObject(payload)

    return {
        session:
            report.session ?? null,

        executiveSummary:
            report.executiveSummary ??
            report.executive_summary ??
            '',

        finalVerdict:
            report.finalVerdict ??
            report.final_verdict ??
            '',

        mediatorFinalSummary:
            report.mediatorFinalSummary ??
            report.mediator_final_summary ??
            '',

        finalConfidence:
            report.finalConfidence ??
            report.final_confidence ??
            null,

        finalRisks:
            cloneValue(
                asArray(
                    report.finalRisks ??
                    report.final_risks
                )
            ),

        finalActions:
            cloneValue(
                asArray(
                    report.finalActions ??
                    report.final_actions
                )
            ),

        unresolvedPoints:
            cloneValue(
                asArray(
                    report.unresolvedPoints ??
                    report.unresolved_points
                )
            ),

        importantNotes:
            cloneValue(
                asArray(
                    report.importantNotes ??
                    report.important_notes
                )
            ),

        rounds:
            cloneValue(
                asArray(
                    report.rounds ??
                    report.roundReports ??
                    report.round_reports
                )
            ),

        turningPoints:
            cloneValue(
                asArray(
                    report.turningPoints ??
                    report.turning_points
                )
            ),

        generatedAt:
            report.generatedAt ??
            report.generated_at ??
            null,

        updatedAt:
            report.updatedAt ??
            report.updated_at ??
            null
    }
}


export const useReportStore =
    defineStore(
        'report',

        {
            state: () => ({
                sessionId: null,

                report: createEmptyReport(),

                selectedRoundNumber: null,
                selectedCharacterId: null,

                isLoading: false,
                isRegenerating: false,

                error: null
            }),


            getters: {
                hasReport:
                    state =>
                        Boolean(
                            state.report?.session
                        ),


                session:
                    state =>
                        state.report?.session ?? null,


                rounds:
                    state =>
                        asArray(
                            state.report?.rounds
                        ),


                turningPoints:
                    state =>
                        asArray(
                            state.report?.turningPoints
                        ),


                finalRisks:
                    state =>
                        asArray(
                            state.report?.finalRisks
                        ),


                finalActions:
                    state =>
                        asArray(
                            state.report?.finalActions
                        ),


                unresolvedPoints:
                    state =>
                        asArray(
                            state.report?.unresolvedPoints
                        ),


                importantNotes:
                    state =>
                        asArray(
                            state.report?.importantNotes
                        ),


                selectedRound(
                    state
                ) {
                    const rounds =
                        asArray(
                            state.report?.rounds
                        )

                    if (
                        state.selectedRoundNumber === null ||
                        state.selectedRoundNumber === undefined
                    ) {
                        return rounds[0] ?? null
                    }

                    return (
                        rounds.find(round => {
                            const number =
                                round?.round?.number ??
                                round?.roundNumber ??
                                round?.round_number ??
                                null

                            return Number(number) === Number(state.selectedRoundNumber)
                        }) ?? null
                    )
                },


                selectedMemberReport(
                    state
                ) {
                    const characterId =
                        normalizeId(
                            state.selectedCharacterId
                        )

                    if (!characterId) {
                        return null
                    }

                    const rounds =
                        asArray(
                            state.report?.rounds
                        )

                    const selectedRound =
                        rounds.find(round => {
                            const number =
                                round?.round?.number ??
                                round?.roundNumber ??
                                round?.round_number ??
                                null

                            return Number(number) === Number(state.selectedRoundNumber)
                        }) ?? rounds[0] ?? null

                    const members =
                        asArray(
                            selectedRound?.memberReports ??
                            selectedRound?.member_reports ??
                            selectedRound?.memberThoughts
                        )

                    return (
                        members.find(member =>
                            String(
                                member.characterId ??
                                member.character_id ??
                                ''
                            ) === characterId
                        ) ?? null
                    )
                },


                confidenceTimeline(
                    state
                ) {
                    return asArray(
                        state.report?.rounds
                    ).map(round => {
                        const confidence =
                            round.confidence ?? {}

                        return {
                            roundNumber:
                                round?.round?.number ??
                                round.roundNumber ??
                                round.round_number ??
                                confidence.roundNumber ??
                                confidence.round_number ??
                                null,

                            before:
                                round.confidenceBefore ??
                                round.confidence_before ??
                                confidence.previousConfidence ??
                                confidence.previous_confidence ??
                                null,

                            after:
                                round.confidenceAfter ??
                                round.confidence_after ??
                                confidence.confidence ??
                                null,

                            change:
                                round.confidenceChange ??
                                round.confidence_change ??
                                confidence.change ??
                                null,

                            reason:
                                round.confidenceChangeReason ??
                                round.confidence_change_reason ??
                                confidence.reason ??
                                ''
                        }
                    })
                }
            },


            actions: {
                setError(error) {
                    this.error = {
                        message:
                            error?.response?.data?.detail ??
                            error?.response?.data?.message ??
                            error?.response?.data?.error?.message ??
                            error?.message ??
                            'Report request failed.',

                        status:
                            error?.response?.status ??
                            error?.status ??
                            0,

                        data:
                            error?.response?.data ??
                            error?.data ??
                            null
                    }
                },


                clearError() {
                    this.error = null
                },


                selectRound(roundNumber) {
                    this.selectedRoundNumber =
                        roundNumber === null || roundNumber === undefined
                            ? null
                            : Number(roundNumber)
                },


                selectCharacter(characterId) {
                    this.selectedCharacterId =
                        normalizeId(characterId)
                },


                async loadReport(sessionId) {
                    const resolvedSessionId =
                        normalizeId(sessionId)

                    if (!resolvedSessionId) {
                        throw new Error('A session ID is required to load a report.')
                    }

                    this.sessionId =
                        resolvedSessionId

                    this.isLoading =
                        true

                    this.error =
                        null

                    try {
                        const { data } =
                            await api.get(
                                `/chamber/sessions/${resolvedSessionId}/report/`
                            )

                        const report =
                            normalizeReport(
                                data.report ?? data
                            )

                        this.report =
                            report

                        const firstRound =
                            asArray(report.rounds)[0]

                        this.selectedRoundNumber =
                            firstRound?.round?.number ??
                            firstRound?.roundNumber ??
                            firstRound?.round_number ??
                            null

                        this.selectedCharacterId =
                            null

                        return report

                    } catch (error) {
                        this.setError(error)

                        throw error

                    } finally {
                        this.isLoading =
                            false
                    }
                },


                async reloadReport() {
                    if (!this.sessionId) {
                        return null
                    }

                    return this.loadReport(
                        this.sessionId
                    )
                },


                async regenerateReport(sessionId = null) {
                    const resolvedSessionId =
                        normalizeId(sessionId) ??
                        normalizeId(this.sessionId)

                    if (!resolvedSessionId) {
                        throw new Error('A session ID is required to regenerate a report.')
                    }

                    this.isRegenerating =
                        true

                    this.error =
                        null

                    try {
                        const { data } =
                            await api.post(
                                `/chamber/sessions/${resolvedSessionId}/report/regenerate/`
                            )

                        const report =
                            normalizeReport(
                                data.report ?? data
                            )

                        this.sessionId =
                            resolvedSessionId

                        this.report =
                            report

                        return report

                    } catch (error) {
                        this.setError(error)

                        throw error

                    } finally {
                        this.isRegenerating =
                            false
                    }
                },


                resetReport() {
                    this.sessionId =
                        null

                    this.report =
                        createEmptyReport()

                    this.selectedRoundNumber =
                        null

                    this.selectedCharacterId =
                        null

                    this.isLoading =
                        false

                    this.isRegenerating =
                        false

                    this.error =
                        null
                }
            }
        }
    )
