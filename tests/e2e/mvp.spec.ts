import { expect, test } from '@playwright/test'

test('admin can login, create project and push status updates', async ({ request }) => {
  const loginResponse = await request.post('/api/admin/login', {
    data: {
      username: 'admin',
      password: 'admin123'
    }
  })
  expect(loginResponse.status()).toBe(200)
  const sessionCookie = loginResponse.headers()['set-cookie']?.split(';')[0]
  expect(sessionCookie).toBeTruthy()

  const projectName = `Project ${Date.now()}`
  const createProjectResponse = await request.post('/api/admin/projects', {
    headers: {
      Cookie: sessionCookie
    },
    data: {
      name: projectName
    }
  })
  expect(createProjectResponse.status()).toBe(200)
  const createdProject = await createProjectResponse.json()
  expect(createdProject.token).toBeTruthy()

  const statusResponse = await request.put('/api/status', {
    headers: {
      Authorization: `Bearer ${createdProject.token}`
    },
    data: {
      status: 'started'
    }
  })
  expect(statusResponse.status()).toBe(202)

  const projectsResponse = await request.get('/api/admin/projects', {
    headers: {
      Cookie: sessionCookie
    }
  })
  expect(projectsResponse.status()).toBe(200)
  const projectsBody = await projectsResponse.json()
  const target = projectsBody.projects.find((project: { name: string }) => project.name === projectName)

  expect(target).toBeTruthy()
  expect(target.latestStatus).toBe('started')
  expect(target.recentEvents.length).toBeGreaterThan(0)
})

test('status endpoint rejects invalid body', async ({ request }) => {
  const response = await request.put('/api/status', {
    headers: {
      Authorization: 'Bearer invalid-token'
    },
    data: {
      status: 'invalid'
    }
  })

  expect(response.status()).toBe(400)
})
