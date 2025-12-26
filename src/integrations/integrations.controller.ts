import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GithubService } from './github/github.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private githubService: GithubService,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  @Post('github/issue')
  async createIssue(
    @Body() body: { productId: string; title: string; body: string },
  ) {
    const product = await this.productRepository.findOne({
      where: { id: body.productId },
    });
    // We need to verify user ownership here in a real app (omitted for MVP speed, reliant on AuthGuard normally)

    if (!product) throw new NotFoundException('Product not found');

    const productWithSecrets = await this.productRepository
        .createQueryBuilder('product')
        .addSelect('product.githubToken')
        .addSelect('product.githubTokenIv')
        .where('product.id = :id', { id: body.productId })
        .getOne();

    if (!productWithSecrets) throw new NotFoundException('Product not found');

    const url = await this.githubService.createIssue(
      productWithSecrets,
      body.title,
      body.body,
    );
    return { url };
  }

  @Post('github/pr')
  async createPr(
    @Body()
    body: {
      productId: string;
      packageName: string;
      targetVersion: string;
      title: string;
      body: string;
    },
  ) {
    const productWithSecrets = await this.productRepository
        .createQueryBuilder('product')
        .addSelect('product.githubToken')
        .addSelect('product.githubTokenIv')
        .where('product.id = :id', { id: body.productId })
        .getOne();

    if (!productWithSecrets) throw new NotFoundException('Product not found');

    const url = await this.githubService.createPullRequest(
      productWithSecrets,
      body.packageName,
      body.targetVersion,
      body.title,
      body.body,
    );
    return { url };
  }
}
