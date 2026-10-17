import { expect, test } from '@playwright/test';

// Smoke tests that need only the running app + a configured Supabase project (seed.sql loaded).
test('landing page shows hero, search and tagline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Find Your First Opportunity/i })).toBeVisible();
  await expect(page.getByText('Your Future Starts With an Internship', { exact: false }).first()).toBeVisible();
});

test('internship search is URL-driven and shows seeded sample listings', async ({ page }) => {
  await page.goto('/internships?q=data');
  await expect(page).toHaveURL(/q=data/);
  await expect(page.getByText(/internship(s)? found/i)).toBeVisible();
});

test('protected areas redirect anonymous visitors to login', async ({ page }) => {
  for (const path of ['/dashboard', '/company', '/admin']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test('registration validates before submitting', async ({ page }) => {
  await page.goto('/register');
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByText('Enter your full name')).toBeVisible();
});

test('unknown pages show the custom 404', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByText(/couldn.t find that page/i)).toBeVisible();
});
