export { useAuthStore } from './authStore';
export { useProjectStore } from './projectStore';

export const useStores = () => ({
  auth: useAuthStore(),
  project: useProjectStore()
});