variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "releaseguard"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "releaseguard"
}

variable "db_username" {
  description = "PostgreSQL username"
  type        = string
  default     = "releaseguard"
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}
