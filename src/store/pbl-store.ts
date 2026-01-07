import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TrackType, MissionProgress } from "@/types/pbl";

/**
 * PBL 상태 인터페이스
 */
interface PBLState {
  /** 현재 선택된 트랙 */
  currentTrack: TrackType | null;
  /** 미션별 진행 상태 */
  missionProgress: Record<string, MissionProgress>;
  /** 사이드바 접힘 상태 */
  isSidebarCollapsed: boolean;
}

/**
 * PBL 액션 인터페이스
 */
interface PBLActions {
  /** 현재 트랙 설정 */
  setCurrentTrack: (track: TrackType | null) => void;
  /** 요구사항 체크 토글 */
  toggleRequirement: (missionId: string, requirementId: string) => void;
  /** 미션 완료 처리 */
  completeMission: (missionId: string) => void;
  /** 미션 방문 기록 */
  visitMission: (missionId: string) => void;
  /** 미션 진행률 초기화 */
  resetMissionProgress: (missionId: string) => void;
  /** 전체 진행률 초기화 */
  resetAllProgress: () => void;
  /** 사이드바 토글 */
  toggleSidebar: () => void;
  /** 사이드바 상태 설정 */
  setSidebarCollapsed: (collapsed: boolean) => void;
}

type PBLStore = PBLState & PBLActions;

/**
 * PBL 상태 관리 스토어
 * 학습 진행률을 로컬 스토리지에 영속화
 */
export const usePBLStore = create<PBLStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      currentTrack: null,
      missionProgress: {},
      isSidebarCollapsed: false,

      // 액션
      setCurrentTrack: (track) => set({ currentTrack: track }),

      toggleRequirement: (missionId, requirementId) => {
        const { missionProgress } = get();
        const current = missionProgress[missionId] || {
          missionId,
          completedRequirements: [],
          isCompleted: false,
          lastVisited: new Date().toISOString(),
        };

        const completed = current.completedRequirements.includes(requirementId)
          ? current.completedRequirements.filter((id) => id !== requirementId)
          : [...current.completedRequirements, requirementId];

        set({
          missionProgress: {
            ...missionProgress,
            [missionId]: {
              ...current,
              completedRequirements: completed,
              lastVisited: new Date().toISOString(),
            },
          },
        });
      },

      completeMission: (missionId) => {
        const { missionProgress } = get();
        const current = missionProgress[missionId];
        if (current) {
          set({
            missionProgress: {
              ...missionProgress,
              [missionId]: {
                ...current,
                isCompleted: true,
                lastVisited: new Date().toISOString(),
              },
            },
          });
        }
      },

      visitMission: (missionId) => {
        const { missionProgress } = get();
        const current = missionProgress[missionId] || {
          missionId,
          completedRequirements: [],
          isCompleted: false,
          lastVisited: new Date().toISOString(),
        };

        set({
          missionProgress: {
            ...missionProgress,
            [missionId]: {
              ...current,
              lastVisited: new Date().toISOString(),
            },
          },
        });
      },

      resetMissionProgress: (missionId) => {
        const { missionProgress } = get();
        const { [missionId]: _, ...rest } = missionProgress;
        set({ missionProgress: rest });
      },

      resetAllProgress: () => set({ missionProgress: {} }),

      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
    }),
    {
      name: "likelion-pbl-storage",
      partialize: (state) => ({
        missionProgress: state.missionProgress,
        currentTrack: state.currentTrack,
      }),
    }
  )
);

/**
 * 미션 진행률 계산 헬퍼
 */
export function calculateProgress(
  missionId: string,
  totalRequirements: number,
  missionProgress: Record<string, MissionProgress>
): number {
  const progress = missionProgress[missionId];
  if (!progress || totalRequirements === 0) return 0;
  return Math.round(
    (progress.completedRequirements.length / totalRequirements) * 100
  );
}
