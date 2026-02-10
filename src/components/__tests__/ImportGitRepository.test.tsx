import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImportGitRepository from '../ImportGitRepository';
import languageColors from 'github-language-colors';

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'test-user-id' } }),
}));

jest.mock('@/hooks/useSubscription', () => ({
  __esModule: true,
  default: () => ({
    userSubscription: null,
    isLoadingUserSubscription: false,
    isErrorUserSubscription: false,
  }),
}));

jest.mock('../../../actions/reverse-architecture', () => ({
  getUserProjects: jest.fn(() => Promise.resolve({ projects: [] })),
}));

jest.mock('../../../actions/user', () => ({
  fetchUserInstallationIdAndProject: jest.fn(() =>
    Promise.resolve({
      success: true,
      installation: { installationId: 'test-installation-id' },
      projects: [],
      user: null,
    })
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock fetch for repository data
global.fetch = jest.fn();

const FALLBACK_COLOR = '#6B7280';

/**
 * Convert hex color to RGB format for comparison
 * Browsers convert hex colors to RGB in computed styles
 */
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgb(${r}, ${g}, ${b})`;
};

const mockRepos = [
  {
    id: 1,
    name: 'test-javascript-repo',
    fullName: 'user/test-javascript-repo',
    description: 'A JavaScript repository',
    private: false,
    language: 'JavaScript',
    stargazersCount: 100,
    forksCount: 10,
    updatedAt: new Date().toISOString(),
    pushedAt: new Date().toISOString(),
    size: 1000,
    defaultBranch: 'main',
    topics: [],
    visibility: 'public',
    owner: {
      login: 'testuser',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  },
  {
    id: 2,
    name: 'test-python-repo',
    fullName: 'user/test-python-repo',
    description: 'A Python repository',
    private: false,
    language: 'Python',
    stargazersCount: 200,
    forksCount: 20,
    updatedAt: new Date().toISOString(),
    pushedAt: new Date().toISOString(),
    size: 2000,
    defaultBranch: 'main',
    topics: [],
    visibility: 'public',
    owner: {
      login: 'testuser',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  },
  {
    id: 3,
    name: 'test-go-repo',
    fullName: 'user/test-go-repo',
    description: 'A Go repository',
    private: false,
    language: 'Go',
    stargazersCount: 150,
    forksCount: 15,
    updatedAt: new Date().toISOString(),
    pushedAt: new Date().toISOString(),
    size: 1500,
    defaultBranch: 'main',
    topics: [],
    visibility: 'public',
    owner: {
      login: 'testuser',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  },
  {
    id: 4,
    name: 'test-unknown-repo',
    fullName: 'user/test-unknown-repo',
    description: 'A repository with unknown language',
    private: false,
    language: null,
    stargazersCount: 50,
    forksCount: 5,
    updatedAt: new Date().toISOString(),
    pushedAt: new Date().toISOString(),
    size: 500,
    defaultBranch: 'main',
    topics: [],
    visibility: 'public',
    owner: {
      login: 'testuser',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  },
  {
    id: 5,
    name: 'test-nonexistent-lang-repo',
    fullName: 'user/test-nonexistent-lang-repo',
    description: 'A repository with a nonexistent language',
    private: false,
    language: 'NonExistentLanguage12345',
    stargazersCount: 25,
    forksCount: 2,
    updatedAt: new Date().toISOString(),
    pushedAt: new Date().toISOString(),
    size: 250,
    defaultBranch: 'main',
    topics: [],
    visibility: 'public',
    owner: {
      login: 'testuser',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  },
];

describe('ImportGitRepository - Language Colors', () => {
  const mockOnImport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ repos: mockRepos }),
    });
  });

  it('should render JavaScript repository with correct color from github-language-colors', async () => {
    render(<ImportGitRepository onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('test-javascript-repo')).toBeInTheDocument();
    });

    const languageDots = document.querySelectorAll('.w-2.h-2.rounded-full');
    const javascriptRow = screen.getByText('test-javascript-repo').closest('tr');
    const javascriptDot = javascriptRow?.querySelector('.w-2.h-2.rounded-full') as HTMLElement;

    expect(javascriptDot).toBeInTheDocument();
    expect(javascriptDot.style.backgroundColor).toBe(hexToRgb((languageColors as Record<string, string>)['JavaScript']));
    expect(javascriptDot).toHaveAttribute('title', 'JavaScript — Language');
    expect(javascriptDot).toHaveAttribute('aria-label', 'JavaScript');
  });

  it('should render Python repository with correct color from github-language-colors', async () => {
    render(<ImportGitRepository onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('test-python-repo')).toBeInTheDocument();
    });

    const pythonRow = screen.getByText('test-python-repo').closest('tr');
    const pythonDot = pythonRow?.querySelector('.w-2.h-2.rounded-full') as HTMLElement;

    expect(pythonDot).toBeInTheDocument();
    expect(pythonDot.style.backgroundColor).toBe(hexToRgb((languageColors as Record<string, string>)['Python']));
    expect(pythonDot).toHaveAttribute('title', 'Python — Language');
    expect(pythonDot).toHaveAttribute('aria-label', 'Python');
  });

  it('should render Go repository with correct color from github-language-colors', async () => {
    render(<ImportGitRepository onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('test-go-repo')).toBeInTheDocument();
    });

    const goRow = screen.getByText('test-go-repo').closest('tr');
    const goDot = goRow?.querySelector('.w-2.h-2.rounded-full') as HTMLElement;

    expect(goDot).toBeInTheDocument();
    expect(goDot.style.backgroundColor).toBe(hexToRgb((languageColors as Record<string, string>)['Go']));
    expect(goDot).toHaveAttribute('title', 'Go — Language');
    expect(goDot).toHaveAttribute('aria-label', 'Go');
  });

  it('should render fallback color for repository with null language', async () => {
    render(<ImportGitRepository onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('test-unknown-repo')).toBeInTheDocument();
    });

    const unknownRow = screen.getByText('test-unknown-repo').closest('tr');
    // For null language, the component renders "-" instead of a dot
    const dashElement = unknownRow?.querySelector('.text-gray-500');

    expect(dashElement).toBeInTheDocument();
    expect(dashElement?.textContent).toBe('-');
  });

  it('should render fallback color for repository with nonexistent language', async () => {
    render(<ImportGitRepository onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('test-nonexistent-lang-repo')).toBeInTheDocument();
    });

    const nonexistentRow = screen.getByText('test-nonexistent-lang-repo').closest('tr');
    const nonexistentDot = nonexistentRow?.querySelector('.w-2.h-2.rounded-full') as HTMLElement;

    expect(nonexistentDot).toBeInTheDocument();
    expect(nonexistentDot.style.backgroundColor).toBe(hexToRgb(FALLBACK_COLOR));
    expect(nonexistentDot).toHaveAttribute('title', 'NonExistentLanguage12345 — Language');
    expect(nonexistentDot).toHaveAttribute('aria-label', 'NonExistentLanguage12345');
  });

  it('should verify color values match the github-language-colors mapping', () => {
    const colors = languageColors as Record<string, string>;

    // Test that common languages have color definitions
    expect(colors['JavaScript']).toBeDefined();
    expect(colors['Python']).toBeDefined();
    expect(colors['Go']).toBeDefined();
    expect(colors['TypeScript']).toBeDefined();
    expect(colors['Java']).toBeDefined();

    // All defined colors should be valid hex colors
    Object.values(colors).forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('should maintain accessibility attributes on language dots', async () => {
    render(<ImportGitRepository onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('test-javascript-repo')).toBeInTheDocument();
    });

    // Check all language dots have proper accessibility attributes
    const languageDots = document.querySelectorAll('.w-2.h-2.rounded-full');

    languageDots.forEach((dot) => {
      const htmlDot = dot as HTMLElement;
      expect(htmlDot).toHaveAttribute('title');
      expect(htmlDot).toHaveAttribute('aria-label');

      const title = htmlDot.getAttribute('title');
      const ariaLabel = htmlDot.getAttribute('aria-label');

      expect(title).toContain('—');
      expect(title).toContain('Language');
      expect(ariaLabel).toBeTruthy();
    });
  });
});
