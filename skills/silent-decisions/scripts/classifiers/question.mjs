// The one question every classifier gets. Kept in one place so every adapter asks it identically.
export function question(req) {
  if (req.task === 'type') {
    return `Classify this sentence from a software plan.\n\nSentence: "${req.statement}"\n\nbehavioural = describes something the running system does that a user or caller could observe.\nstructural = technology, architecture, dependencies, code organisation.\nprocess = scope notes, ways of working, out-of-scope lists, non-goals.`;
  }
  if (req.task === 'census') {
    return `A software plan contains this sentence:\n"${req.statement}"\n\nAt ${req.location} the code contains this ${req.kind}:\n${req.code}\n\nThat is a place where the implementer chose a value, threshold, default, rounding, ordering or rejection rule. Does the sentence explicitly decide that choice, so that a different choice would contradict the sentence? yes or no.`;
  }
  if (req.task === 'realises') {
    return `A software plan contains this sentence:\n"${req.statement}"\n\nA test of the built system: given ${req.given}, when ${req.when}, then ${req.outcome}.\n\nIs this test an instance of what the sentence describes, so that the sentence would be at least partly untrue of a system that failed it? yes or no. It does not matter whether the sentence settles every detail of the outcome.`;
  }
  return `A software plan contains this sentence:\n"${req.statement}"\n\nConsider a system where: given ${req.given}, when ${req.when}.\n\nOutcome a: ${req.outcome_a}\nOutcome b: ${req.outcome_b}\n\nRead the sentence literally, as a contract. Which outcome does the sentence REQUIRE?\na = a system with outcome b would violate the sentence.\nb = a system with outcome a would violate the sentence.\nneither = a system with either outcome would satisfy the sentence, or the sentence is not about this situation.`;
}
