import { defineStore } from "pinia"
import api from "@/services/api"

export const useAppStore = defineStore("app", {
    state: () => ({
        appName: "Gosei",
        status: "idle",
        backendMessage: null,
        error: null
    }),

    getters: {
        isLoading: state => state.status === "loading"
    },

    actions: {
        async fetchBackendHealth() {
            this.status = "loading"
            this.error = null

            try {
                const response = await api.get("/health/")
                this.backendMessage = response.data
                this.status = "ready"
            } catch (error) {
                this.error = error.message || "Could not reach backend"
                this.status = "error"
            }
        }
    }
})
