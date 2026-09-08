export function scriptFactProvenanceStatus(script){
  const facts=Array.isArray(script?.sourceFactsDetailed)?script.sourceFactsDetailed:[];
  if(!facts.length){
    return {
      hasStructuredProvenance:false,
      factCount:0,
      verifiedCount:0,
      canValidate:true,
      reason:null
    };
  }
  const verifiedCount=facts.filter(fact=>fact?.provenanceVerified===true).length;
  const canValidate=verifiedCount===facts.length;
  return {
    hasStructuredProvenance:true,
    factCount:facts.length,
    verifiedCount,
    canValidate,
    reason:canValidate?null:`${facts.length-verifiedCount} fait(s) ont une provenance YouTube non vérifiée.`
  };
}

export function canValidateScript(script){
  return scriptFactProvenanceStatus(script).canValidate;
}

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
