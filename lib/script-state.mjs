export function mergeGeneratedScripts(existingScripts, generatedScripts, generation, makeId){
  const validated=(existingScripts||[]).filter(script=>script.status==='validated');
  const proposals=(generatedScripts||[]).map(script=>({
    ...script,
    id:makeId(),
    status:'proposed',
    generatedAt:generation.generatedAt,
    model:generation.model,
    provider:generation.provider,
    generationMode:generation.generationMode,
    originality:generation.originality,
    limitations:generation.limitations
  }));
  return [...validated,...proposals];
}
