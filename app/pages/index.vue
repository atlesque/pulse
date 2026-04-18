<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { AdminProjectsResponse, AdminSessionResponse, LoginResponse, TokenCreateResponse } from '~/types/api'

const queryClient = useQueryClient()

const loginForm = ref({ username: 'admin', password: 'admin123' })
const createProjectName = ref('')
const tokenNotice = ref<{ projectName: string, token: string } | null>(null)
const isAuthenticated = ref(false)
const isSessionLoading = ref(true)

onMounted(async () => {
  const session = await $fetch<AdminSessionResponse>('/api/admin/session')
  isAuthenticated.value = session.authenticated
  isSessionLoading.value = false
})

const projectsQuery = useQuery<AdminProjectsResponse>({
  queryKey: ['admin-projects'],
  queryFn: () => $fetch('/api/admin/projects'),
  enabled: isAuthenticated
})

const loginMutation = useMutation({
  mutationFn: async () => {
    const response = await $fetch<LoginResponse>('/api/admin/login', {
      method: 'POST',
      body: {
        username: loginForm.value.username,
        password: loginForm.value.password
      }
    })

    tokenNotice.value = null
    return response
  },
  onSuccess: async () => {
    isAuthenticated.value = true
    await queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
  }
})

const logoutMutation = useMutation({
  mutationFn: async () => {
    await $fetch('/api/admin/logout', { method: 'POST' })
  },
  onSuccess: async () => {
    isAuthenticated.value = false
    tokenNotice.value = null
    await queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
  }
})

const createProjectMutation = useMutation({
  mutationFn: async () => {
    return await $fetch<TokenCreateResponse>('/api/admin/projects', {
      method: 'POST',
      body: {
        name: createProjectName.value
      }
    })
  },
  onSuccess: async (data) => {
    tokenNotice.value = {
      projectName: data.project.name,
      token: data.token
    }
    createProjectName.value = ''
    await queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
  }
})

const regenerateTokenMutation = useMutation({
  mutationFn: async (projectId: number) => {
    return await $fetch<TokenCreateResponse>(`/api/admin/projects/${projectId}/tokens`, {
      method: 'POST'
    })
  },
  onSuccess: async (data) => {
    tokenNotice.value = {
      projectName: data.project.name,
      token: data.token
    }
    await queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
  }
})

const revokeTokenMutation = useMutation({
  mutationFn: async (tokenId: number) => {
    await $fetch(`/api/admin/tokens/${tokenId}/revoke`, { method: 'POST' })
  },
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-projects'] })
  }
})

const loginError = computed(() => {
  const message = loginMutation.error.value?.message
  if (!message) {
    return null
  }

  return 'Invalid username or password'
})

const createProjectError = computed(() => createProjectMutation.error.value?.message ?? null)
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-2xl font-semibold">
        Task Status Tracker
      </h1>

      <UButton
        v-if="isAuthenticated"
        label="Log out"
        color="neutral"
        variant="outline"
        :loading="logoutMutation.isPending.value"
        @click="logoutMutation.mutate()"
      />
    </div>

    <UAlert
      v-if="tokenNotice"
      data-testid="token-notice"
      icon="i-lucide-key-round"
      color="warning"
      variant="soft"
      :title="`API token for ${tokenNotice.projectName}`"
      description="Token is only shown once. Store it safely."
    >
      <template #description>
        <p
          class="font-mono break-all"
          data-testid="created-token"
        >
          {{ tokenNotice.token }}
        </p>
      </template>
    </UAlert>

    <UCard
      v-if="isSessionLoading"
      class="max-w-md"
    >
      <div class="py-4 text-sm text-muted">
        Loading session...
      </div>
    </UCard>

    <UCard
      v-else-if="!isAuthenticated"
      class="max-w-md"
      data-testid="login-card"
    >
      <template #header>
        <h2 class="text-lg font-medium">
          Admin login
        </h2>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="loginMutation.mutate()"
      >
        <UFormField
          label="Username"
          required
        >
          <UInput
            v-model="loginForm.username"
            data-testid="username-input"
          />
        </UFormField>

        <UFormField
          label="Password"
          required
        >
          <UInput
            v-model="loginForm.password"
            type="password"
            data-testid="password-input"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Log in"
          block
          :loading="loginMutation.isPending.value"
          data-testid="login-button"
        />
      </form>

      <p
        v-if="loginError"
        class="text-sm text-error mt-3"
        data-testid="login-error"
      >
        {{ loginError }}
      </p>
    </UCard>

    <template v-else>
      <UCard>
        <template #header>
          <h2 class="text-lg font-medium">
            Create project
          </h2>
        </template>

        <form
          class="flex flex-col md:flex-row gap-3"
          @submit.prevent="createProjectMutation.mutate()"
        >
          <UInput
            v-model="createProjectName"
            class="flex-1"
            placeholder="Project name"
            data-testid="project-name-input"
            required
          />

          <UButton
            type="submit"
            label="Create"
            :loading="createProjectMutation.isPending.value"
            data-testid="create-project-button"
          />
        </form>

        <p
          v-if="createProjectError"
          class="text-sm text-error mt-3"
        >
          {{ createProjectError }}
        </p>
      </UCard>

      <div
        class="space-y-4"
        data-testid="projects-list"
      >
        <UCard
          v-for="project in projectsQuery.data.value?.projects ?? []"
          :key="project.id"
          :data-testid="`project-${project.id}`"
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-lg font-medium">
                {{ project.name }}
              </h3>
              <UBadge
                :color="project.latestStatus ? (project.latestStatus === 'error' ? 'error' : (project.latestStatus === 'started' ? 'success' : 'neutral')) : 'neutral'"
              >
                {{ project.latestStatus ?? 'unknown' }}
              </UBadge>
            </div>
          </template>

          <div class="space-y-3">
            <p class="text-sm text-muted">
              Last update: {{ project.latestStatusAt ?? 'Never' }}
            </p>

            <div class="flex flex-wrap gap-2">
              <UButton
                size="sm"
                label="Regenerate token"
                :loading="regenerateTokenMutation.isPending.value"
                @click="regenerateTokenMutation.mutate(project.id)"
              />
            </div>

            <div class="space-y-2">
              <h4 class="text-sm font-semibold">
                API tokens
              </h4>
              <ul class="space-y-2">
                <li
                  v-for="token in project.tokens"
                  :key="token.id"
                  class="text-sm border rounded p-2 flex items-center justify-between gap-2"
                >
                  <span class="font-mono">{{ token.uid }}</span>
                  <div class="flex items-center gap-2">
                    <UBadge :color="token.revokedAt ? 'neutral' : 'success'">
                      {{ token.revokedAt ? 'revoked' : 'active' }}
                    </UBadge>
                    <UButton
                      v-if="!token.revokedAt"
                      size="xs"
                      color="error"
                      variant="outline"
                      label="Revoke"
                      @click="revokeTokenMutation.mutate(token.id)"
                    />
                  </div>
                </li>
              </ul>
            </div>

            <div class="space-y-2">
              <h4 class="text-sm font-semibold">
                Recent history
              </h4>
              <ul class="space-y-2">
                <li
                  v-for="event in project.recentEvents"
                  :key="event.id"
                  class="text-sm border rounded p-2 flex items-center justify-between"
                >
                  <span>{{ event.status }}</span>
                  <span class="text-muted">{{ event.timestamp }}</span>
                </li>
                <li
                  v-if="project.recentEvents.length === 0"
                  class="text-sm text-muted"
                >
                  No events yet
                </li>
              </ul>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UContainer>
</template>
