import type {
  Adr,
  ArtifactsView,
  EpicNode,
  FeatureNode,
  TaskNode,
} from "./tree";

export function findEpic(
  view: ArtifactsView,
  slug: string,
): EpicNode | undefined {
  return view.epics.find((e) => e.slug === slug);
}

export function findFeature(
  view: ArtifactsView,
  slug: string,
): { epic: EpicNode; feature: FeatureNode } | undefined {
  for (const epic of view.epics) {
    const feature = epic.features.find((f) => f.slug === slug);
    if (feature) return { epic, feature };
  }
  return undefined;
}

export function findTask(
  view: ArtifactsView,
  slug: string,
):
  | { epic: EpicNode; feature: FeatureNode; task: TaskNode }
  | undefined {
  for (const epic of view.epics) {
    for (const feature of epic.features) {
      const task = feature.tasks.find((t) => t.slug === slug);
      if (task) return { epic, feature, task };
    }
  }
  return undefined;
}

export function findAdr(view: ArtifactsView, id: string): Adr | undefined {
  return view.adrs.find((a) => a.id === id);
}

export function countAll(view: ArtifactsView): {
  epics: number;
  features: number;
  tasks: number;
  adrs: number;
  companions: number;
} {
  let features = 0;
  let tasks = 0;
  let companions = view.epics.reduce((n, e) => n + e.companions.length, 0);
  for (const epic of view.epics) {
    features += epic.features.length;
    for (const feature of epic.features) {
      companions += feature.companions.length;
      tasks += feature.tasks.length;
      for (const task of feature.tasks) {
        companions += task.companions.length;
      }
    }
  }
  return {
    epics: view.epics.length,
    features,
    tasks,
    adrs: view.adrs.length,
    companions,
  };
}
