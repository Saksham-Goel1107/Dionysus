// Centralized markdown templates for MarkdownGenModal
type TemplateParams = { email: string; project: string };

const templates = {
  'CODE_OF_CONDUCT.md': ({ email, project }: TemplateParams) => `# ${project || 'your-repo'} Code of Conduct

Like the technical community as a whole, the ${project || 'your-repo'} team and community is made up of a mixture of professionals and volunteers from all over the world, working on every aspect of the mission - including mentorship, teaching, and connecting people.

Diversity is one of our huge strengths, but it can also lead to communication issues and unhappiness. To that end, we have a few ground rules that we ask people to adhere to. This code applies equally to founders, mentors and those seeking help and guidance.

This isn’t an exhaustive list of things that you can’t do. Rather, take it in the spirit in which it’s intended - a guide to make it easier to enrich all of us and the technical communities in which we participate.

This code of conduct applies to all spaces managed by the ${project || 'your-repo'} project or . This includes IRC, the mailing lists, the issue tracker, DSF events, and any other forums created by the project team which the community uses for communication. In addition, violations of this code outside these spaces may affect a person's ability to participate within them.

If you believe someone is violating the code of conduct, we ask that you report it by emailing [${email || 'your-email'}](mailto:${email || 'your-email'}).


- **Be friendly and patient.**
- **Be welcoming.** We strive to be a community that welcomes and supports people of all backgrounds and identities. This includes, but is not limited to members of any race, ethnicity, culture, national origin, colour, immigration status, social and economic class, educational level, sex, sexual orientation, gender identity and expression, age, size, family status, political belief, religion, and mental and physical ability.
- **Be considerate.** Your work will be used by other people, and you in turn will depend on the work of others. Any decision you take will affect users and colleagues, and you should take those consequences into account when making decisions. Remember that we're a world-wide community, so you might not be communicating in someone else's primary language.
- **Be respectful.** Not all of us will agree all the time, but disagreement is no excuse for poor behavior and poor manners. We might all experience some frustration now and then, but we cannot allow that frustration to turn into a personal attack. It’s important to remember that a community where people feel uncomfortable or threatened is not a productive one. Members of the ${project || 'your-repo'} community should be respectful when dealing with other members as well as with people outside the ${project || 'your-repo'} community.

- **Be careful in the words that you choose.** We are a community of professionals, and we conduct ourselves professionally. Be kind to others. Do not insult or put down other participants. Harassment and other exclusionary behavior aren't acceptable. This includes, but is not limited to: 
 - Violent threats or language directed against another person.
 - Discriminatory jokes and language.
 - Posting sexually explicit or violent material.
 - Posting (or threatening to post) other people's personally identifying information ("doxing").
 - Personal insults, especially those using racist or sexist terms.
 - Unwelcome sexual attention.
 - Advocating for, or encouraging, any of the above behavior.
 - Repeated harassment of others. In general, if someone asks you to stop, then stop.
- **When we disagree, try to understand why.** Disagreements, both social and technical, happen all the time and ${project || 'your-repo'} is no exception. It is important that we resolve disagreements and differing views constructively. Remember that we’re different. The strength of ${project || 'your-repo'} comes from its varied community, people from a wide range of backgrounds. Different people have different perspectives on issues. Being unable to understand why someone holds a viewpoint doesn’t mean that they’re wrong. Don’t forget that it is human to err and blaming each other doesn’t get us anywhere. Instead, focus on helping to resolve issues and learning from mistakes.


Original text courtesy of the [Speak Up! project](http://web.archive.org/web/20141109123859/http://speakup.io/coc.html).

## Questions?

If you have questions, please see . If that doesn't answer your questions, feel free to [contact us](mailto:${email || 'your-email'}).`,




  'CONTRIBUTING.md': ({ email, project, username }: TemplateParams & { username?: string }) => `# Contributing to ${project || 'your-repo'}

Thank you for your interest in contributing to ${project || 'your-repo'}! 🚀  
Your ideas and code help make this project better for everyone. We welcome all contributions—whether it’s code, documentation, bug reports, or suggestions.

---

## 🛠️ How to Contribute

### 1. Fork & Clone

- Fork this repository to your GitHub account.
- Clone your fork to your machine:

  \`\`\`bash
  git clone https://github.com/${username || 'your-username'}/${project || 'your-repo'}.git
  cd ${project || 'your-repo'}
  \`\`\`

### 2. Create a Branch

- Create a new branch for your feature or fix:

  \`\`\`bash
  git checkout -b your-feature-name
  \`\`\`

### 3. Make Your Changes

- Follow the existing code style and conventions.
- Write clear, maintainable code.
- Add or update tests when relevant.
- Update documentation as needed.

### 4. Commit & Push

- Make atomic commits with clear messages:

  \`\`\`bash
  git add .
  git commit -m "Describe your changes"
  git push origin your-feature-name
  \`\`\`

### 5. Open a Pull Request

- Go to the [original repo](https://github.com/${username || 'your-username'}/${project || 'your-repo'}).
- Click “New Pull Request.”
- Select your branch and fill out the PR template, describing your changes and linking any relevant issues.
- Be patient and open to feedback during the review process.

---

## 📝 Guidelines

- **Be respectful** and constructive in all communications.
- **Check existing [issues](https://github.com/${username || 'your-username'}/${project || 'your-repo'}/issues) and PRs** before starting work to avoid duplication.
- **Open an issue** for major changes to discuss your approach before submitting code.
- **Keep pull requests focused**—smaller PRs are easier to review and merge.
- For larger features or refactors, please describe your approach and reasoning in the pull request description.

---

## 🤝 Code of Conduct

Please read and follow our [Code of Conduct](https://github.com/${username || 'your-username'}/${project || 'your-repo'}/blob/main/CODE_OF_CONDUCT.md) to ensure a welcoming and respectful community for everyone.

If you believe someone is violating the code of conduct, please report it by emailing [${email || 'your-email'}](mailto:${email || 'your-email'}).


---

## 💬 Need Help?

- Open an [issue](https://github.com/${username || 'your-username'}/${project || 'your-repo'}/issues) if you have questions or need guidance.
- Start a discussion to propose new features, share ideas, or seek collaborators.

---

Thank you for helping make ${project || 'your-repo'} better! 🌟`,
  
  
'SECURITY.md': ({ email, project }: TemplateParams) => `# Security Policy

Thank you for helping keep ${project || 'your-repo'} and its users safe!


## Reporting a Vulnerability

If you discover a security vulnerability in ${project || 'your-repo'}, please **do not open a public issue**. Instead, report it directly and responsibly by following these steps:

1. **Email:**  
   Please send your report to [${email || 'your-email'}](mailto:${email || 'your-email'}) with details of the vulnerability and steps to reproduce.


2. **What to include:**  
   - A clear description of the vulnerability.
   - Steps to reproduce or proof of concept.
   - Any relevant logs, screenshots, or code snippets.

3. **Response:**  
   - You will receive an acknowledgment within 2 business days.
   - We aim to investigate and address all reports promptly.
   - Please keep the details confidential until a fix is released and we coordinate disclosure.

## Supported Versions

Only the latest version of ${project || 'your-repo'} is currently supported with security updates. Please ensure you keep your installation up-to-date.

| Version | Supported          |
| ------- | -------------------|
| Latest  | ✅                |

## Responsible Disclosure

We appreciate your help in responsibly disclosing vulnerabilities. Your effort makes the ${project || 'your-repo'} project and the community safer!

---

For any security-related questions or concerns, please contact [${email || 'your-email'}](mailto:${email || 'your-email'}).`,
};

export default templates;
