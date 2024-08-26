import getCodeDocsListByUserEmail from "@/repositories/code-docs/get-code-docs-list-by-user-email";

async function codeDocsListGetByUserEmailService(userEmail: string) {
  const codeDocsList = await getCodeDocsListByUserEmail(userEmail);
  return codeDocsList;
}

export default codeDocsListGetByUserEmailService;
