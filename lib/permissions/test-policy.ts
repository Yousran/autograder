export interface TestPolicyContext {
  /** The authenticated user's ID. */
  userId: string;
}

export const TestPolicy = {
  /**
   * ABAC Rule: Checks if the user is the creator/owner of the test.
   */
  isOwner: (
    test: { creatorId: string },
    context: TestPolicyContext,
  ): boolean => {
    return test.creatorId === context.userId;
  },

  /**
   * ABAC Rule: Checks if the user can create a test.
   * Requires the user to be authenticated (context.userId is always set).
   */
  canCreate: (): boolean => {
    return true;
  },

  /**
   * ABAC Rule: Checks if the user can view full test details (must be owner).
   */
  canView: (
    test: { creatorId: string },
    context: TestPolicyContext,
  ): boolean => {
    return TestPolicy.isOwner(test, context);
  },

  /**
   * ABAC Rule: Checks if the user can edit the test (must be owner).
   */
  canEdit: (
    test: { creatorId: string },
    context: TestPolicyContext,
  ): boolean => {
    return TestPolicy.isOwner(test, context);
  },

  /**
   * ABAC Rule: Checks if the user can delete the test (must be owner).
   */
  canDelete: (
    test: { creatorId: string },
    context: TestPolicyContext,
  ): boolean => {
    return TestPolicy.isOwner(test, context);
  },
};
