<script setup>
import ChamberFlow from '@/components/chamber/anime/ChamberFlow.vue'

import SelectionPage from '@/components/chamber/anime/SelectionPage.vue'

import PanelCalibrationPage from '@/components/chamber/anime/PanelCalibrationPage.vue'

import MediatorCalibrationPage from '@/components/chamber/anime/MediatorCalibrationPage.vue'

import DiscussionPage from '@/components/chamber/anime/DiscussionPage.vue'

import SoloDiscussionPage from "@/components/chamber/anime/SoloDiscussionPage.vue";
</script>


<template>
  <ChamberFlow
      class="anime-chamber"

      :selection-component="
        SelectionPage
      "

      :panel-calibration-component="
        PanelCalibrationPage
      "

      :mediator-calibration-component="
        MediatorCalibrationPage
      "

      :discussion-component="
        DiscussionPage
      "

      :solo-discussion-component="
        SoloDiscussionPage
      "
  />
</template>


<style scoped>
.anime-chamber {
  width: 100%;
  height: 100%;
}
</style>
