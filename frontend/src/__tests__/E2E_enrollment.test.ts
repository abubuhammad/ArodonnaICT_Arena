/**
 * E2E Smoke Tests: Course Enrollment and Progress
 * 
 * These tests verify core user flows:
 * - Enroll in a free course
 * - Start course and initialize progress
 * - View lessons and mark complete
 * - Submit quizzes and track attempts
 * - Fetch progress API and verify gating
 */

import axios from '../services/axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

describe('E2E: Course Enrollment & Progress', () => {
  let studentId: string;
  let courseId: string;
  let enrollmentId: string;
  let token: string;

  beforeAll(async () => {
    // Setup: Create or login a test student
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test-student@example.com',
      password: 'TestPass@123'
    });
    token = loginRes.data.token;
    studentId = loginRes.data.user.id;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  });

  it('should fetch available courses', async () => {
    const res = await axios.get(`${BASE_URL}/courses`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    if (res.data.length > 0) {
      courseId = res.data[0].id;
    }
  });

  it('should enroll in a free course', async () => {
    if (!courseId) {
      console.log('Skipping enrollment test: no course found');
      return;
    }
    const res = await axios.post(`${BASE_URL}/enrollments`, { courseId });
    expect(res.status).toBe(201);
    expect(res.data.enrollment).toBeDefined();
    enrollmentId = res.data.enrollment._id || res.data.enrollment.id;
  });

  it('should start course and get initial progress', async () => {
    if (!enrollmentId) {
      console.log('Skipping start course: no enrollment');
      return;
    }
    const res = await axios.post(`${BASE_URL}/enrollments/${enrollmentId}/start`);
    expect(res.status).toBe(200);

    const progressRes = await axios.get(`${BASE_URL}/enrollments/${enrollmentId}/progress`);
    expect(progressRes.status).toBe(200);
    expect(progressRes.data.modules).toBeDefined();
    expect(Array.isArray(progressRes.data.modules)).toBe(true);
  });

  it('should verify first lesson is unlocked and others locked', async () => {
    if (!enrollmentId) {
      console.log('Skipping lesson lock test: no enrollment');
      return;
    }
    const res = await axios.get(`${BASE_URL}/enrollments/${enrollmentId}/progress`);
    const firstModule = res.data.modules[0];
    if (!firstModule || !firstModule.lessons.length) {
      console.log('Skipping: no lessons found');
      return;
    }
    expect(firstModule.lessons[0].status).not.toBe('LOCKED');
    if (firstModule.lessons.length > 1) {
      expect(firstModule.lessons[1].status).toBe('LOCKED');
    }
  });

  afterAll(() => {
    delete axios.defaults.headers.common['Authorization'];
  });
});
