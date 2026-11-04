import { expect, test, type Page } from '@playwright/test';

const HOST = { email: 'host@backroom.local', password: 'password123' };
const LISTING = 'The Lobby, Reclaimed';

// Unique per run so re-running against the same database never collides with
// an earlier registration or an application already on file.
const runId = Date.now().toString(36);
const RENTER = {
  name: `E2E Renter ${runId}`,
  email: `e2e-renter-${runId}@example.com`,
  password: 'correct-horse-battery',
};
const APPLICATION_NOTE = `Household of one, available immediately. Run ${runId}.`;

const card = (page: Page, title: string) =>
  page.getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

const signOut = async (page: Page) => {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
};

const signIn = async (page: Page, email: string, password: string) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Check in' }).click();
  await expect(page).toHaveURL('/');
};

test.describe('guest', () => {
  test('browses and searches the directory', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Available units' })).toBeVisible();
    await expect(card(page, LISTING)).toBeVisible();

    await page.getByLabel('Keyword').fill('annex');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page).toHaveURL(/keyword=annex/);
    await expect(card(page, 'Lobby Annex, No Exit')).toBeVisible();
    await expect(card(page, LISTING)).toHaveCount(0);

    await page.getByLabel('Keyword').fill('xqzvkw');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('No units on file')).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(card(page, LISTING)).toBeVisible();
  });

  test('is sent to sign in before reaching a protected page', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Returning resident' })).toBeVisible();
  });

  test('rejects a wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(HOST.email);
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Check in' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('loads the level map', async ({ page }) => {
    await page.goto('/map');
    await expect(page.getByRole('application', { name: /Survey chart/ })).toBeVisible();
  });
});

// Renter registers, saves and applies; the host accepts; the renter sees the
// decision. Each step depends on the one before it, so the tests share state
// and stop at the first failure.
test.describe.serial('renter to host application flow', () => {
  test('renter registers a new account', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Full name').fill(RENTER.name);
    await page.getByLabel('Email').fill(RENTER.email);
    await page.getByLabel('Password').fill(RENTER.password);
    await page.getByRole('button', { name: 'File application' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('navigation', { name: 'Main' })).toContainText(RENTER.name);
  });

  test('renter saves a listing and applies for it', async ({ page }) => {
    await signIn(page, RENTER.email, RENTER.password);

    await card(page, LISTING).getByRole('link', { name: 'Open file' }).click();
    await expect(page.getByRole('heading', { level: 1, name: LISTING })).toBeVisible();

    const save = page.getByRole('button', { name: 'Save file' });
    await save.click();
    await expect(page.getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('link', { name: 'Saved', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Saved files' })).toBeVisible();
    await expect(card(page, LISTING)).toBeVisible();

    await card(page, LISTING).getByRole('link', { name: 'Open file' }).click();
    await page.getByRole('button', { name: 'Apply for residency' }).click();
    await page.getByLabel('Why this unit?').fill(APPLICATION_NOTE);
    await page.getByRole('button', { name: 'File application' }).click();

    await expect(page.getByText('Application on file.')).toBeVisible();

    await page.getByRole('link', { name: 'Applications' }).click();
    await expect(page.getByRole('heading', { name: 'Your applications' })).toBeVisible();
    await expect(page.getByText(APPLICATION_NOTE)).toBeVisible();
    await expect(page.getByText('Pending review')).toBeVisible();

    await signOut(page);
  });

  test('host accepts the application', async ({ page }) => {
    await signIn(page, HOST.email, HOST.password);

    await page.getByRole('link', { name: 'Inbox' }).click();
    await expect(page.getByRole('heading', { name: 'Incoming applications' })).toBeVisible();

    // The default view only lists pending files, and an accepted one leaves it.
    await page.getByRole('button', { name: /^All \(/ }).click();

    const entry = page.getByRole('listitem').filter({ hasText: APPLICATION_NOTE });
    await expect(entry).toContainText(RENTER.name);
    await expect(entry).toContainText(LISTING);

    await entry.getByRole('button', { name: 'Accept' }).click();
    await expect(entry).toContainText('Accepted');
    await expect(entry.getByRole('button', { name: 'Accept' })).toHaveCount(0);

    await signOut(page);
  });

  test('renter sees the accepted decision', async ({ page }) => {
    await signIn(page, RENTER.email, RENTER.password);

    await page.getByRole('link', { name: 'Applications' }).click();
    const entry = page.getByRole('listitem').filter({ hasText: APPLICATION_NOTE });
    await expect(entry).toContainText('Accepted');
    await expect(entry).toContainText(LISTING);
  });
});
