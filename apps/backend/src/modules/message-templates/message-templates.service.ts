import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { MessageTemplateRepository } from "../../repositories/interfaces";
import { MessageTemplate } from "../../common/types";
import { CreateTemplateDto } from "./dto/template.dto";

@Injectable()
export class MessageTemplatesService {
  constructor(
    @Inject(MessageTemplateRepository)
    private readonly repo: MessageTemplateRepository,
  ) {}

  /** Extract {{variable}} names from template content */
  extractVariables(content: string): string[] {
    const matches = content.match(/\{\{(\w+)\}\}/g) ?? [];
    return [...new Set(matches.map((m) => m.slice(2, -2)))];
  }

  /** Replace {{variable}} with actual values */
  render(content: string, variables: Record<string, string>): string {
    return content.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => variables[key] ?? `{{${key}}}`,
    );
  }

  async create(
    userId: string,
    dto: CreateTemplateDto,
  ): Promise<MessageTemplate> {
    const variables = this.extractVariables(dto.content);
    return this.repo.save({
      id: uuidv4(),
      userId,
      name: dto.name,
      content: dto.content,
      variables,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async list(userId: string): Promise<MessageTemplate[]> {
    return this.repo.findAllByUserId(userId);
  }

  async update(
    id: string,
    userId: string,
    dto: Partial<CreateTemplateDto>,
  ): Promise<MessageTemplate> {
    const tpl = await this.repo.findById(id);
    if (!tpl) throw new NotFoundException("Template not found");
    if (tpl.userId !== userId) throw new ForbiddenException();
    const variables = dto.content
      ? this.extractVariables(dto.content)
      : tpl.variables;
    const updated = await this.repo.update(id, { ...dto, variables });
    return updated!;
  }

  async delete(id: string, userId: string): Promise<void> {
    const tpl = await this.repo.findById(id);
    if (!tpl) throw new NotFoundException("Template not found");
    if (tpl.userId !== userId) throw new ForbiddenException();
    await this.repo.delete(id);
  }

  async renderById(
    id: string,
    userId: string,
    variables: Record<string, string>,
  ): Promise<string> {
    const tpl = await this.repo.findById(id);
    if (!tpl) throw new NotFoundException("Template not found");
    if (tpl.userId !== userId) throw new ForbiddenException();
    return this.render(tpl.content, variables);
  }
}
