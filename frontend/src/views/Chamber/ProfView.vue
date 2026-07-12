<script setup>
import ChamberFlow from '@/components/chamber/prof/ChamberFlow.vue'

import SelectionPage from '@/components/chamber/prof/SelectionPage.vue'

import CalibrationPage from '@/components/chamber/prof/CalibrationPage.vue'

import DiscussionPage from '@/components/chamber/prof/DiscussionPage.vue'
</script>


<template>
  <ChamberFlow
      class="anime-chamber"

      :selection-component="
      SelectionPage
    "

      :calibration-component="
      CalibrationPage
    "

      :discussion-component="
      DiscussionPage
    "
  />
</template>


<style scoped>
.anime-chamber {
  width: 100%;
  height: 100%;
}
</style>

