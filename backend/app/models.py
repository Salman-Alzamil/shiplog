from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    github_id = Column(Integer, unique=True, nullable=False)
    github_username = Column(String, nullable=False)
    github_access_token = Column(String, nullable=False)
    email = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    repo_owner = Column(String, nullable=False)
    repo_name = Column(String, nullable=False)
    # unique token used in the webhook URL so we know which project it belongs to
    webhook_token = Column(String, unique=True, nullable=False)
    # secret the user sets in GitHub webhook settings for signature verification
    webhook_secret = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="projects")
    entries = relationship(
        "ChangelogEntry",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ChangelogEntry.published_at.desc()",
    )


class ChangelogEntry(Base):
    __tablename__ = "changelog_entries"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    pr_number = Column(Integer)
    pr_title = Column(String)
    pr_body = Column(Text)
    pr_url = Column(String)
    pr_merged_by = Column(String)
    generated_title = Column(String)
    generated_summary = Column(Text)
    category = Column(String, default="improvement")  # feature | fix | improvement
    is_published = Column(Boolean, default=True)
    published_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="entries")
