import { Injectable, Logger } from '@nestjs/common';
import { render } from 'ejs';
import { writeFileSync } from 'fs';
import { createTransport } from 'nodemailer';
import path from 'path';
import { ConfigsService } from '~/modules/configs/configs.service';
import { LinkModel } from '~/modules/link/link.model';
import { AssetService } from './helper.asset.service';

export enum ReplyMailType {
  Owner = 'owner',
  Guest = 'guest',
}

export enum LinkApplyEmailType {
  ToMaster,
  ToCandidate,
}

@Injectable()
export class EmailService {
  private instance: ReturnType<typeof createTransport>;
  private logger: Logger;
  constructor(
    private readonly configsService: ConfigsService,
    private readonly assetService: AssetService,
  ) {
    this.init();
    this.logger = new Logger(EmailService.name);
  }

  async readTemplate(type: ReplyMailType) {
    switch (type) {
      case ReplyMailType.Guest:
        return this.assetService.getAsset(
          '/email-template/guest.template.ejs',
          { encoding: 'utf-8' },
        );
      case ReplyMailType.Owner:
        return this.assetService.getAsset(
          '/email-template/owner.template.ejs',
          { encoding: 'utf-8' },
        );
    }
  }

  writeTemplate(type: ReplyMailType, source: string) {
    switch (type) {
      case ReplyMailType.Guest:
        return writeFileSync(
          path.resolve(
            process.cwd(),
            'assets/email-template/guest.template.ejs',
          ),
          source,
          { encoding: 'utf-8' },
        );
      case ReplyMailType.Owner:
        return writeFileSync(
          path.resolve(
            process.cwd(),
            'assets/email-template/owner.template.ejs',
          ),
          source,
          { encoding: 'utf-8' },
        );
    }
  }

  init() {
    this.getConfigFromConfigService()
      .then((config) => {
        this.instance = createTransport({
          ...config,
          secure: true,
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.checkIsReady().then((ready) => {
          if (ready) {
            this.logger.log('送信服务已经加载完毕！');
          }
        });
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});
  }

  private getConfigFromConfigService() {
    return new Promise<{
      host: string;
      port: number;
      auth: { user: string; pass: string };
    }>((r, j) => {
      this.configsService.waitForConfigReady().then(({ mailOptions }) => {
        const { options, user, pass } = mailOptions;
        if (!user && !pass) {
          const message = '邮件件客户端未认证';
          this.logger.error(message);
          return j(message);
        }
        r({
          host: options?.host,
          port: +options?.port || 465,
          auth: { user, pass },
        } as const);
      });
    });
  }

  async checkIsReady() {
    return !!this.instance && (await this.verifyClient());
  }

  // 验证有效性
  private verifyClient() {
    return new Promise<boolean>((r, j) => {
      this.instance.verify((error) => {
        if (error) {
          this.logger.error('邮件客户端初始化连接失败！');
          r(false);
        } else {
          r(true);
        }
      });
    });
  }

  /**
   * Notification Link Apply (send to master)
   *
   */
  async sendLinkApplyEmail({
    to,
    model,
    authorName,
    template,
  }: {
    authorName?: string;
    to: string;
    model: LinkModel;
    template: LinkApplyEmailType;
  }) {
    const { seo, mailOptions } = await this.configsService.waitForConfigReady();
    const { user } = mailOptions;
    const from = `"${seo.title || 'Mx Space'}" <${user}>`;
    await this.instance.sendMail({
      from,
      to,
      subject:
        template === LinkApplyEmailType.ToMaster
          ? `[${seo.title || 'Mx Space'}] 新的朋友 ${authorName}`
          : `嘿!~, 主人已通过你的友链申请!~`,
      text:
        template === LinkApplyEmailType.ToMaster
          ? `来自 ${model.name} 的友链请求: 
          站点标题: ${model.name}
          站点网站: ${model.url}
          站点描述: ${model.description}
        `
          : `你的友链申请: ${model.name}, ${model.url} 已通过`,
    });
  }

  async sendCommentNotificationMail({
    to,
    source,
    type,
  }: {
    to: string;
    source: RenderProps;
    type: ReplyMailType;
  }) {
    const { seo, mailOptions } = await this.configsService.waitForConfigReady();
    const { user } = mailOptions;
    const from = `"${seo.title || 'Mx Space'}" <${user}>`;
    if (type === ReplyMailType.Guest) {
      await this.instance.sendMail({
        from,
        ...{
          subject: `[${seo.title || 'Mx Space'}] 主人给你了新的回复呐`,
          to,
          html: this.render((await this.readTemplate(type)) as string, source),
        },
      });
    } else
      await this.instance.sendMail({
        from,
        ...{
          subject: `[${seo.title || 'Mx Space'}] 有新回复了耶~`,
          to,
          html: this.render((await this.readTemplate(type)) as string, source),
        },
      });
  }

  render(template: string, source: RenderProps) {
    return render(template, {
      text: source.text,
      time: source.time,
      author: source.author,
      link: source.link,
      ip: source.ip || '',
      title: source.title,
      master: source.master,
      mail: source.mail,
    } as RenderProps);
  }

  getInstance() {
    return this.instance;
  }
}

interface RenderProps {
  author: string;
  ip?: string;
  text: string;
  link: string;
  time: string;
  mail: string;
  title: string;
  master?: string;
}
